```astro
---
import { useI18n } from "i18n:astro/server"

const {
    t,
    locale, // DONE
    localePath, // DONE
    switchLocalePath,
    getHtmlAttrs, // DONE
    getHead,
    setDynamicParams // DONE
} = useI18n(Astro)

t('welcome')
localePath('index')
localePath({ href: 'blog', params: { category, slug }})
switchLocalePath('fr')
---

<html {...getHtmlAttrs()}>
    <head>
        {getHead()}
    </head>
    <body>
        <h1>{t('title')}</h1>
        <script>import { t, localePath, switchLocalePath, getLocale } from "i18n:astro/client"</script>
    </body>
</html>
```