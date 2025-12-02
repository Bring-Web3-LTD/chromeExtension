# 🎨 מדריך עיצוב OfferLine

## ✅ מה עשינו?

יצרנו מערכת משתנים נפרדת ל-OfferLine שיורשת אוטומטית מהפופאפ הרגיל.

---

## 📍 איפה המשתנים?

**קובץ:** `iframe-frontend/src/main.css`

**שורות 107-172** - כל המשתנים של OfferLine

---

## 🔧 איך לשנות גודל/עיצוב של OfferLine?

### דוגמה 1: שינוי גודל הפופאפ

**להגדיל את גובה ה-Details section:**

```css
/* מצא בקובץ main.css שורה ~164 */
--offerline-details-height: 174px;

/* שנה ל: */
--offerline-details-height: 200px;
```

**להגדיל את ה-padding הכללי:**

```css
/* שורה ~113 */
--offerline-container-padding: 16px;

/* שנה ל: */
--offerline-container-padding: 20px;
```

---

### דוגמה 2: שינוי צבע כפתור Activate

```css
/* שורה ~122 */
--offerline-primary-btn-bg: var(--primary-btn-bg);

/* שנה ל: */
--offerline-primary-btn-bg: #00AA00;  /* ירוק */
```

---

### דוגמה 3: שינוי גובה כפתורים

```css
/* שורה ~128 */
--offerline-primary-btn-height: 40px;

/* שנה ל: */
--offerline-primary-btn-height: 48px;  /* יותר גבוה */
```

---

### דוגמה 4: שינוי גודל טקסט

```css
/* שורה ~153 */
--offerline-details-subtitle-f-s: var(--details-subtitle-f-s);

/* שנה ל: */
--offerline-details-subtitle-f-s: 16px;  /* טקסט גדול יותר */
```

---

### דוגמה 5: שינוי רווחים בין אלמנטים

```css
/* שורה ~114 */
--offerline-container-gap: 16px;

/* שנה ל: */
--offerline-container-gap: 20px;  /* רווח גדול יותר */
```

---

## 📋 רשימת כל המשתנים שאפשר לשנות:

### מבנה ורווחים:
```css
--offerline-container-padding     /* padding של הקונטיינר הראשי */
--offerline-container-gap          /* רווח בין סקשנים */
--offerline-top-gap                /* רווח בין wallet ו-demo */
--offerline-action-gap             /* רווח בסקשן הפעולות */
--offerline-btns-gap               /* רווח בין כפתורים */
```

### כפתור ראשי (Activate):
```css
--offerline-primary-btn-bg         /* צבע רקע */
--offerline-primary-btn-f-c        /* צבע טקסט */
--offerline-primary-btn-f-w        /* עובי פונט */
--offerline-primary-btn-f-s        /* גודל פונט */
--offerline-primary-btn-border-c   /* צבע גבול */
--offerline-primary-btn-border-w   /* רוחב גבול */
--offerline-primary-btn-radius     /* עיגול פינות */
--offerline-primary-btn-height     /* גובה */
```

### כפתורים משניים (Cancel/Pause):
```css
--offerline-secondary-btn-bg       /* צבע רקע */
--offerline-secondary-btn-f-c      /* צבע טקסט */
--offerline-secondary-btn-f-w      /* עובי פונט */
--offerline-secondary-btn-f-s      /* גודל פונט */
--offerline-secondary-btn-border-c /* צבע גבול */
--offerline-secondary-btn-border-w /* רוחב גבול */
--offerline-secondary-btn-radius   /* עיגול פינות */
--offerline-secondary-btn-height   /* גובה */
```

### Wallet:
```css
--offerline-wallet-bg              /* צבע רקע */
--offerline-wallet-f-c             /* צבע טקסט */
--offerline-wallet-f-w             /* עובי פונט */
--offerline-wallet-f-s             /* גודל פונט */
--offerline-wallet-border-c        /* צבע גבול */
--offerline-wallet-border-w        /* רוחב גבול */
--offerline-wallet-radius          /* עיגול פינות */
--offerline-wallet-height          /* גובה */
--offerline-wallet-padding         /* padding פנימי */
```

### סקשן Details (לוגואים וטקסט):
```css
--offerline-details-bg             /* צבע רקע */
--offerline-details-title-f-c      /* צבע כותרת */
--offerline-details-title-f-w      /* עובי פונט כותרת */
--offerline-details-title-f-s      /* גודל פונט כותרת */
--offerline-details-subtitle-f-c   /* צבע טקסט משני */
--offerline-details-subtitle-f-w   /* עובי פונט משני */
--offerline-details-subtitle-f-s   /* גודל פונט משני */
--offerline-details-amount-f-c     /* צבע סכום קאשבק */
--offerline-details-amount-f-w     /* עובי פונט סכום */
--offerline-details-radius         /* עיגול פינות */
--offerline-details-border-w       /* רוחב גבול */
--offerline-details-border-c       /* צבע גבול */
--offerline-details-height         /* גובה כולל */
--offerline-details-gap            /* רווח פנימי */
--offerline-details-padding        /* padding */
```

### טקסט הבהרה (Clarify):
```css
--offerline-clarify-f-s            /* גודל פונט */
--offerline-clarify-f-w            /* עובי פונט */
--offerline-clarify-f-c            /* צבע */
```

---

## 🎯 איך המערכת עובדת?

### מנגנון ברירת המחדל:

כל משתנה של OfferLine מוגדר כך:
```css
--offerline-wallet-bg: var(--wallet-bg);
```

**משמעות:** אם לא תשנה את `--offerline-wallet-bg`, הוא ייקח את הערך מ-`--wallet-bg` (של הפופאפ הרגיל)

### אם רוצים ערך שונה:
פשוט משנים:
```css
--offerline-wallet-bg: #FF0000;  /* אדום במקום הצבע של הפופאפ */
```

---

## 🚀 תהליך עבודה מומלץ:

1. **פתח את הקובץ:** `iframe-frontend/src/main.css`
2. **גלול לשורה 107** (תחילת סקשן OfferLine)
3. **שנה רק את מה שאתה צריך:**
   - לא צריך לשנות הכל
   - מה שלא משתנה - נשאר כמו הפופאפ
4. **שמור ובדוק בדפדפן**

---

## 💡 טיפים:

### טיפ 1: שינויים מהירים
אם רוצה רק להגדיל/להקטין - שנה את ה-height/padding/gap

### טיפ 2: שמירה על עקביות
אם משנה צבע כפתור - כדאי לשנות גם את הכפתורים המשניים

### טיפ 3: גודל הפופאפ הכולל
גודל הפופאפ מוגדר ב-2 מקומות:
1. **Iframe wrapper** - `offerLineIframeStyles.ts` (width, height)
2. **תוכן פנימי** - `main.css` (המשתנים)

---

## 📞 שאלות נפוצות:

**ש: איך משנים את הגובה הכולל של הפופאפ?**
ת: שנה את `--offerline-details-height` ואת `--offerline-container-padding`

**ש: איך משנים רק את OfferLine בלי לגעת בפופאפ הרגיל?**
ת: כל המשתנים של OfferLine מתחילים ב-`--offerline-*`, הפופאפ הרגיל לא יושפע

**ש: מה קורה אם אשכח להגדיר משתנה?**
ת: אוטומטית נלקח הערך מהפופאפ הרגיל (fallback)

**ש: איך לראות את השינויים?**
ת: שמור את הקובץ והדפדפן יתרענן אוטומטית (hot reload)

---

## ✅ סיכום:

1. כל המשתנים ב-`main.css` (שורות 107-172)
2. שנה רק מה שצריך
3. מה שלא משנים - יורש מהפופאפ
4. שמור ובדוק

**זהו! המערכת מוכנה לשימוש 🎉**
