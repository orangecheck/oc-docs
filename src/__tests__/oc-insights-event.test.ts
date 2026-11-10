// @vitest-environment node
import analyticsEvent from '@orangecheck/site-kit/analytics-event';
import { describe, expect, it } from 'vitest';

import * as route from '../pages/api/oc-insights/event';

// site-kit's own tests hold what its handler sends on; this holds that the site's route is that handler.
describe('/api/oc-insights/event', () => {
    it("is site-kit's analytics-event handler, with nothing of its own", () => {
        expect(route.default).toBe(analyticsEvent);
        expect(Object.keys(route)).toEqual(['default']);
    });
});
