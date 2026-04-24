import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="application-name" content="OrangeCheck docs" />
                <meta name="theme-color" content="#f97316" />
                <meta name="color-scheme" content="dark light" />
            </Head>
            <body className="dark">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
