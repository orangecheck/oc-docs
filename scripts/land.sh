#!/usr/bin/env bash
# Land a branch on main through the merge queue.
#
# main takes no direct push: the queue tests each PR on top of main and the
# ones queued ahead of it, then moves main to the exact commit it tested, so
# two lanes landing at once never race. This pushes the branch, opens (or
# reuses) its PR, queues it, and waits until main holds it.
#
#   bash scripts/land.sh <branch>          LAND_TIMEOUT=<seconds> (default 3600)
#
# Refuses when a check fails on the PR, when the queue drops it, or when the PR
# is closed. Rebase isn't needed first: the queue rebases onto main itself.
set -euo pipefail

branch=${1:?usage: bash scripts/land.sh <branch>}
repo=orangecheck/oc-docs
# A stale GITHUB_TOKEN in the environment answers "Bad credentials".
gh() { env -u GITHUB_TOKEN gh "$@"; }
refuse() {
    echo "land: $*" >&2
    exit 1
}

sha=$(git rev-parse --verify "$branch^{commit}")
git push -q origin "$sha:refs/heads/$branch"
if ! gh pr view "$branch" -R "$repo" --json number > /dev/null 2>&1; then
    gh pr create -R "$repo" --base main --head "$branch" --title "$(git log -1 --format=%s "$sha")" \
        --body "Landed by scripts/land.sh through the merge queue." > /dev/null
fi
gh pr merge "$branch" -R "$repo" --auto > /dev/null
number=$(gh pr view "$branch" -R "$repo" --json number --jq .number)

# shellcheck disable=SC2016 # GraphQL variables, not shell ones
query='query($n: Int!) { repository(owner: "orangecheck", name: "oc-docs") { pullRequest(number: $n) {
    state isInMergeQueue autoMergeRequest { enabledAt } mergeQueueEntry { state } mergeCommit { oid }
    commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } } } }'
deadline=$((SECONDS + ${LAND_TIMEOUT:-3600}))
queued=
while :; do
    line=$(gh api graphql -f query="$query" -F n="$number" --jq '.data.repository.pullRequest
        | [.state, .isInMergeQueue, (.autoMergeRequest != null), (.mergeQueueEntry.state // "-"),
           (.commits.nodes[0].commit.statusCheckRollup.state // "-"), (.mergeCommit.oid // "-")] | @tsv')
    IFS=$'\t' read -r state in_queue auto entry checks merged <<< "$line"
    case $state in
        MERGED) break ;;
        CLOSED) refuse "PR #$number for $branch was closed" ;;
    esac
    case $checks in FAILURE | ERROR) refuse "a check failed on PR #$number: gh pr checks $number -R $repo" ;; esac
    [ "$entry" != UNMERGEABLE ] || refuse "the queue can't merge PR #$number: its group run failed or it conflicts with main"
    [ "$in_queue" = true ] && queued=1
    # A failed group run drops the PR from the queue and turns auto-merge off.
    [ -z "$queued" ] || [ "$in_queue" = true ] || [ "$auto" = true ] \
        || refuse "the queue dropped PR #$number: its group run failed or main changed under it"
    ((SECONDS < deadline)) || refuse "timed out waiting for the queue to merge PR #$number"
    sleep 20
done

echo "land: main is now $merged (PR #$number)"
