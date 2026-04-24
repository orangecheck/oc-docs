import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="/favicons/favicon-16x16.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/favicons/favicon-32x32.png"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/favicons/apple-touch-icon.png"
                />
                <link rel="manifest" href="/favicons/site.webmanifest" />
                <meta name="application-name" content="OrangeCheck docs" />
                <meta name="theme-color" content="#f97316" />
                <meta name="color-scheme" content="dark light" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
