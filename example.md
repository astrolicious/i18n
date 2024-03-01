```astro
---
import { useI18n } from "i18n:astro/server"

const {
    t, // DONE
    locale, // DONE
    localePath, // DONE
    switchLocalePath, // DONE
    getHtmlAttrs, // DONE
    setDynamicParams // DONE
} = useI18n(Astro)

t('welcome')
localePath('index')
localePath({ href: 'blog', params: { category, slug }})
switchLocalePath('fr')
---

<html {...getHtmlAttrs()}>
    <head>
        <I18nHead /> <!-- DONE -->
    </head>
    <body>
        <h1>{t('title')}</h1>
        <script>
            import {
                t,
                localePath,
                switchLocalePath,
                locale // DONE
            } from "i18n:astro/client"
        </script>
    </body>
</html>
```