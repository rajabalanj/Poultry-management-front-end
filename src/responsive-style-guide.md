---

# ✅ **The Practical, Proven Style Guide for “Good on All Devices” (Bootstrap + React)**

## **1. Use a Strict 12-Column Grid Everywhere**

Don’t guess spacing. Let Bootstrap do all the math.

* Use containers:

  ```html
  <Container fluid>
    <Row>
      <Col md={6} lg={4} xl={3}>...</Col>
    </Row>
  </Container>
  ```
* **Mobile-first:**

  ```html
  <Col xs={12} sm={6} md={4} lg={3}>
  ```

  This auto-adapts from 6-inch phones → 32-inch monitors.

**Rule:**
👉 *If you stick to grid breakpoints, your layout will never break.*

---

## **2. Always Use Bootstrap Breakpoints**

These 5 breakpoints have been stable for a decade:

| Device                     | Breakpoint    | Meaning          |
| -------------------------- | ------------- | ---------------- |
| Phone                      | `xs <576px`   | Stack vertically |
| Large phone / small tablet | `sm ≥576px`   |                  |
| Tablet                     | `md ≥768px`   |                  |
| Small laptop               | `lg ≥992px`   |                  |
| Desktop / large monitor    | `xl ≥1200px`  |                  |
| Ultra-wide                 | `xxl ≥1400px` |                  |

**Rule:**
👉 Never hard-code screen sizes. Use Bootstrap's breakpoints only.

---

## **3. Use Utility Classes Instead of Custom CSS**

This keeps your UI consistent and saves time.

Examples:

### Spacing

* `mb-3`, `mt-4`, `p-2`

### Display

* `d-flex`, `justify-content-between`, `align-items-center`

### Text

* `text-center`, `fw-bold`

### Colors

* `bg-light`, `text-muted`

**Rule:**
👉 80% of UI can be written with Bootstrap utilities.
Less custom CSS → fewer bugs → more consistent.

---

## **4. Use Bootstrap Components as Much as Possible**

These are already responsive:

* Cards
* Navbars
* Forms
* Alert banners
* Tables
* Modals
* Pagination
* Accordion
* Offcanvas

**Rule:**
👉 Every time you want a custom UI element, ask:
*“Is there a Bootstrap component that already solves this?”*

If yes → use it.
If no → use a simple flexbox layout.

---

## **5. Use a Max-Width Container for Reading Sections**

Dashboard pages should be full width,
but forms, content pages should not stretch too wide.

Use:

```html
<Container style={{ maxWidth: "900px" }}>
```

**Rule:**
👉 Never allow text to fill a 32-inch monitor.
Max width improves readability.

---

## **6. Follow the 8-Point Spacing System**

Used by Google, Apple, Meta, Microsoft.

Spacing values:
**0, 4px, 8px, 12px, 16px, 24px, 32px, 48px**

Bootstrap’s spacing utilities already reflect this.

Use:

* `p-2` (8px)
* `p-3` (16px)
* `p-4` (24px)
* `my-4` (24px vertical margin)

**Rule:**
👉 Never use random pixel values in CSS.

---

## **7. Typography Scale**

Bootstrap uses a proven scale:

| Class | Size    |
| ----- | ------- |
| `.h1` | 2.5rem  |
| `.h2` | 2rem    |
| `.h3` | 1.75rem |
| `.h4` | 1.5rem  |
| `.h5` | 1.25rem |
| `.h6` | 1rem    |

**Rule:**
👉 Don’t choose your own font sizes. Use Bootstrap’s heading classes.

---

## **8. Use Responsive Tables Properly**

Tables break easily on mobile.

Use:

```html
<div className="table-responsive">
  <Table striped bordered hover>
```

**Rule:**
👉 Always wrap tables in `.table-responsive`.

---

## **9. Use Cards for All Blocks of Information**

Cards are the most stable unit in responsive UI.

Layout example:

```html
<Row>
  <Col md={6} lg={4}>
    <Card className="mb-3">...</Card>
  </Col>
</Row>
```

**Rule:**
👉 Use cards for anything that appears as a “block”.

---

## **10. Use a Sidebar + Topbar Layout for Dashboards**

This layout works across all devices.

* On mobile → Sidebar becomes offcanvas menu
* On desktop → Sidebar is visible
* Bootstrap already supports it

This is the layout almost every admin panel uses.

---

# 🎯 **If you follow only these principles, your UI will look excellent.**

You do **not** need Tailwind, Material UI, or custom design systems unless you want.

Bootstrap + React + these rules =
✔ Professional
✔ Consistent
✔ Responsive
✔ Zero design effort
✔ Decade-tested patterns