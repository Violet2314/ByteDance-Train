# Fresh Vitality Green Style Guide

**Style Overview**:
A lightweight flat design with soft natural green primary colors, creating visual hierarchy through subtle surface color differences and gentle shadows, paired with a dreamy multi-color blurred gradient background in barely-visible beige and light green halos, achieving a friendly, modern, and serene aesthetic.

## Colors
### Primary Colors
  - **primary-base**: `text-[#7CAA6D]` or `bg-[#7CAA6D]`
  - **primary-lighter**: `bg-[#A1C493]`
  - **primary-darker**: `text-[#5F8A52]` or `bg-[#5F8A52]`

### Background Colors

#### Structural Backgrounds

Choose based on layout type:

**For Vertical Layout** (Top Header + Optional Side Panels):
- **bg-nav-primary**: `style="background: radial-gradient(circle at 20% 30%, rgba(161, 196, 147, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(210, 190, 165, 0.06) 0%, transparent 50%), #FDFCFA;"` - Top header with subtle gradient halos
- **bg-nav-secondary**: `style="background: radial-gradient(circle at 15% 40%, rgba(161, 196, 147, 0.06) 0%, transparent 45%), #FEFDFB;"` - Inner Left sidebar (if present)
- **bg-page**: `style="background: radial-gradient(circle at 50% 20%, rgba(161, 196, 147, 0.10) 0%, transparent 60%), radial-gradient(circle at 85% 75%, rgba(210, 190, 165, 0.08) 0%, transparent 55%), #FDFCF9;"` - Page background (bg of Main Content area)

**For Horizontal Layout** (Side Navigation + Optional Top Bar):
- **bg-nav-primary**: `style="background: radial-gradient(circle at 30% 25%, rgba(161, 196, 147, 0.08) 0%, transparent 50%), #FDFCFA;"` - Left main sidebar
- **bg-nav-secondary**: `style="background: radial-gradient(circle at 60% 30%, rgba(161, 196, 147, 0.06) 0%, transparent 45%), #FEFDFB;"` - Inner Top header (if present)
- **bg-page**: `style="background: radial-gradient(circle at 50% 20%, rgba(161, 196, 147, 0.10) 0%, transparent 60%), radial-gradient(circle at 85% 75%, rgba(210, 190, 165, 0.08) 0%, transparent 55%), #FDFCF9;"` - Page background (bg of Main Content area)

#### Container Backgrounds
For main content area. Adjust values when used on navigation backgrounds to ensure sufficient contrast.
- **bg-container-primary**: `bg-white/85`
- **bg-container-secondary**: `bg-white/60`
- **bg-container-inset**: `bg-[#7CAA6D]/8`
- **bg-container-inset-strong**: `bg-[#7CAA6D]/15`

### Text Colors
- **color-text-primary**: `text-[#3A3A3A]`
- **color-text-secondary**: `text-[#6B6B6B]`
- **color-text-tertiary**: `text-[#9A9A9A]`
- **color-text-quaternary**: `text-[#C4C4C4]`
- **color-text-on-dark-primary**: `text-white/90` - Text on dark backgrounds and primary-base, accent-dark color surfaces
- **color-text-on-dark-secondary**: `text-white/70` - Text on dark backgrounds and primary-base, accent-dark color surfaces
- **color-text-link**: `text-[#7CAA6D]` - Links, text-only buttons without backgrounds, and clickable text in tables

### Functional Colors
Use **sparingly** to maintain a minimalist and neutral overall style. Used for the surfaces of text-only cards, simple cards, buttons, and tags.
  - **color-success-default**: #C8DFC0
  - **color-success-light**: #E7F3E3 - tag/label bg
  - **color-error-default**: #D9B3AD - alert banner bg
  - **color-error-light**: #F5DDD9 - tag/label bg
  - **color-warning-default**: #EED8B5 - tag/label bg
  - **color-warning-light**: #F9EDCF - tag/label bg, alert banner bg
  - **color-function-default**: #7B9CB8
  - **color-function-light**: #C8DEEF - tag/label bg

### Accent Colors
  - A secondary palette for occasional highlights and categorization. **Avoid overuse** to protect brand identity. Use **sparingly**.
  - **accent-sage**: `text-[#9AB89A]` or `bg-[#9AB89A]` - Gray-green, muted and natural
  - **accent-cyan**: `text-[#A3C4C4]` or `bg-[#A3C4C4]` - Soft cyan, gentle and calm
  - **accent-warm-gray**: `text-[#B8ADA3]` or `bg-[#B8ADA3]` - Warm gray with beige undertones

### Data Visualization Charts
For data visualization charts only.
  - Standard data colors: #9AB89A, #A3C4C4, #B8ADA3, #7CAA6D, #8BB5B5, #C4B5A8
  - Important data can use small amounts of: #5F8A52, #6B9A9A, #8D7A6B

## Typography
- **Font Stack**:
  - **font-family-base**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` — For regular UI copy

- **Font Size & Weight**:

  - **Caption**: `text-sm font-normal`
  - **Body**: `text-base font-normal`
  - **Body Emphasized**: `text-base font-semibold`
  - **Card Title / Subtitle**: `text-lg font-semibold`
  - **Page Title**: `text-2xl font-semibold`
  - **Headline**: `text-3xl font-semibold`

- **Line Height**: 1.6

## Border Radius
  - **Small**: 8px — Elements inside cards (e.g., photos)
  - **Medium**: 12px
  - **Large**: 16px — Cards
  - **Full**: full — Toggles, avatars, small tags, inputs, etc.

## Layout & Spacing
  - **Tight**: 8px - For closely related small internal elements, such as icons and text within buttons
  - **Compact**: 12px - For small gaps between small containers, such as a line of tags
  - **Standard**: 20px - For gaps between medium containers like list items
  - **Relaxed**: 28px - For gaps between large containers and sections
  - **Section**: 36px - For major section divisions


## Create Boundaries (contrast of surface color, borders, shadows)
Case: Primarily relying on surface color contrast complemented by soft shadows to create gentle layering and refined clarity
### Borders
  - **Case 1**: Generally avoid borders for a cleaner, softer appearance.
  - **Case 2**: If needed for inputs or special emphasis
    - **Default**: 1px solid #E5E8E3 (light greenish gray). Used for inputs, cards. `border border-[#E5E8E3]`
    - **Stronger**: 1px solid #D4D9D0 (medium greenish gray). Used for active or focused states. `border border-[#D4D9D0]`

### Dividers
  - **Case 1**: Prefer using subtle background color differences over dividers.
  - **Case 2**: If needed, `border-t` or `border-b` `border-[#E8EBE6]`.

### Shadows & Effects
  - **Case 1**: No shadow for completely flat elements.
  - **Case 2 (subtle shadow)**: `shadow-[0_2px_10px_rgba(124,170,109,0.06)]` - Very gentle greenish tint
  - **Case 3 (moderate shadow)**: `shadow-[0_3px_14px_rgba(124,170,109,0.10)]` - Soft depth with natural green hint
  - **Case 4 (pronounced shadow)**: `shadow-[0_4px_20px_rgba(124,170,109,0.14)]` - Clear elevation with subtle green warmth

## Visual Emphasis for Containers
When containers (tags, cards, list items, rows) need visual emphasis to indicate priority, status, or category, use the following techniques:

| Technique | Implementation Notes | Best For | Avoid |
|-----------|---------------------|----------|-------|
| Background Tint | Slightly darker/lighter color or reduce transparency of backgrounds | Gentle, common approach for moderate emphasis needs | Heavy colors on large areas (e.g., red background for entire large cards) |
| Border Highlight | Use thin border with opacity for subtlety | Active/selected states, form validation | - |
| Glow/Shadow Effect | Keep shadow subtle with low opacity and greenish tint | Premium aesthetics, hover states | - |
| Status Tag/Label | Add colored tag/label inside container | Larger containers | - |

## Assets
### Image

- For normal `<img>`: `object-cover`
- For `<img>` with:
  - Slight overlay: `object-cover brightness-95`
  - Heavy overlay: `object-cover brightness-75`

### Icon

- Use Lucide icons from Iconify.
- To ensure an aesthetic layout, each icon should be centered in a square container, typically without a background, matching the icon's size.
- Use Tailwind font size to control icon size
- Example:
  ```html
  <div class="flex items-center justify-center bg-transparent w-5 h-5">
  <iconify-icon icon="lucide:package" class="text-base"></iconify-icon>
  </div>
  ```

### Third-Party Brand Logos:
   - Use Brand Icons from Iconify.
   - Logo Example:
     Monochrome Logo: `<iconify-icon icon="simple-icons:x"></iconify-icon>`
     Colored Logo: `<iconify-icon icon="logos:google-icon"></iconify-icon>`

### User's Own Logo:
- To protect copyright, do **NOT** use real product logos as a logo for a new product, individual user, or other company products.
- **Icon-based**:
  - **Graphic**: Use a simple, relevant icon (e.g., a `package` icon for a logistics app, a `truck` icon for a delivery service).

## Page Layout - Web
### Determine Layout Type
- Choose between Vertical or Horizontal layout based on whether the primary navigation is a full-width top header or a full-height sidebar (left/right).
- User requirements typically indicate the layout preference. If unclear, consider:
  - Marketing/content sites typically use Vertical Layout.
  - Functional/dashboard sites can use either, depending on visual style. Sidebars accommodate more complex navigation than top bars. For complex navigation needs with a preference for minimal chrome (Vertical Layout adds an extra fixed header), choose Horizontal Layout (omits the fixed top header).
- Vertical Layout Diagram:
┌──────────────────────────────────────────────────────┐
│  Header (Primary Nav)                                │
├──────────┬──────────────────────────────┬────────────┤
│Left      │ Sub-header (Tertiary Nav)    │ Right      │
│Sidebar   │ (optional)                   │ Sidebar    │
│(Secondary├──────────────────────────────┤ (Utility   │
│Nav)      │ Main Content                 │ Panel)     │
│(optional)│                              │ (optional) │
│          │                              │            │
└──────────┴──────────────────────────────┴────────────┘
- Horizontal Layout Diagram:
┌──────────┬──────────────────────────────┬───────────┐
│          │ Header (Secondary Nav)       │           │
│ Left     │ (optional)                   │ Right     │
│ Sidebar  ├──────────────────────────────┤ Sidebar   │
│ (Primary │ Main Content                 │ (Utility  │
│ Nav)     │                              │ Panel)    │
│          │                              │ (optional)│
│          │                              │           │
└──────────┴──────────────────────────────┴───────────┘
### Detailed Layout Code
**Vertical Layout**
```html
<!-- Body: Adjust width (w-[1440px]) based on target screen size -->
<body class="w-[1440px] min-h-[700px] font-[-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] leading-[1.6]">

  <!-- Header (Primary Nav): Fixed height -->
  <header class="w-full">
    <!-- Header content -->
  </header>

  <!-- Content Container: Must include 'flex' class -->
  <div class="w-full flex min-h-[700px]">
    <!-- Left Sidebar (Secondary Nav) (Optional): Remove if not needed. If Left Sidebar exists, use its ml to control left page margin -->
    <aside class="flex-shrink-0 min-w-fit">

    </aside>

    <!-- Main Content Area:
     Use Main Content Area's horizontal padding (px) to control distance from main content to sidebars or page edges.
     For pages without sidebars (like Marketing Pages, simple content pages such as help centers, privacy policies) use larger values (px-30 to px-80), for pages with sidebars (Functional/Dashboard Pages, complex content pages with multi-level navigation like knowledge base articles) use moderate values (px-8 to px-16) -->
    <main class="flex-1 overflow-x-hidden flex flex-col">
    <!--  Main Content -->

    </main>

    <!-- Right Sidebar (Utility Panel) (Optional): Remove if not needed. If Right Sidebar exists, use its mr to control right page margin -->
    <aside class="flex-shrink-0 min-w-fit">
    </aside>

  </div>
</body>
```

**Horizontal Layout**

```html
<!-- Body: Adjust width (w-[1440px]) based on target screen size. Must include 'flex' class -->
<body class="w-[1440px] min-h-[700px] flex font-[-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] leading-[1.6]">

<!-- Left Sidebar (Primary Nav): Use its ml to control left page margin -->
  <aside class="flex-shrink-0 min-w-fit">
  </aside>

  <!-- Content Container-->
  <div class="flex-1 overflow-x-hidden flex flex-col min-h-[700px]">

    <!-- Header (Secondary Nav) (Optional): Remove if not needed. If Header exists, use its mx to control distance to left/right sidebars or page margins -->
    <header class="w-full">
    </header>

    <!-- Main Content Area: Use Main Content Area's pl to control distance from main content to left sidebar. Use pr to control distance to right sidebar/right page edge -->
    <main class="w-full">
    </main>


  </div>

  <!-- Right Sidebar (Utility Panel) (Optional): Remove if not needed. If Right Sidebar exists, use its mr to control right page margin -->
  <aside class="flex-shrink-0 min-w-fit">
  </aside>

</body>
```

## Tailwind Component Examples (Key attributes)
**Important Note**: Use utility classes directly. Do NOT create custom CSS classes or add styles in <style> tags for the following components
### Basic

- **Button**: (Note: Use flex and items-center for the container)
  - Example 1 (text button):
    - button: `flex items-center gap-2 px-5 py-2.5 bg-[#7CAA6D] text-white/90 rounded-full hover:bg-[#5F8A52] transition`
      - span(button copy): `whitespace-nowrap text-base font-semibold`
  - Example 2 (icon button):
    - button: `flex items-center justify-center w-10 h-10 bg-[#7CAA6D] text-white/90 rounded-full hover:bg-[#5F8A52] transition`
      - icon

- **Tag Group (Filter Tags)** (Note: `overflow-x-auto` and `whitespace-nowrap` are required)
  - container(scrollable): `flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden`
    - label (Tag item 1):
      - input: `type="radio" name="tag1" class="sr-only peer" checked`
      - div: `px-4 py-2 rounded-full bg-white/60 text-[#6B6B6B] peer-checked:bg-[#7CAA6D] peer-checked:text-white/90 hover:opacity-80 transition whitespace-nowrap cursor-pointer text-sm`

### Data Entry
- **Progress bars/Slider**: `h-2 bg-[#7CAA6D]/15 rounded-full`
  - Progress fill: `h-full bg-[#7CAA6D] rounded-full transition-all`

- **Checkbox**
  - label: `flex items-center gap-2 cursor-pointer`
    - input: `type="checkbox" class="sr-only peer"`
    - div: `w-5 h-5 bg-[#7CAA6D]/8 rounded-md flex items-center justify-center peer-checked:bg-[#7CAA6D] text-transparent peer-checked:text-white/90 transition`
      - svg(Checkmark): `w-3 h-3 stroke-current stroke-[3]`
    - span(text): `text-base text-[#3A3A3A]`

- **Radio button**
  - label: `flex items-center gap-2 cursor-pointer`
    - input: `type="radio" name="option1" class="sr-only peer"`
    - div: `w-5 h-5 bg-[#7CAA6D]/8 rounded-full flex items-center justify-center peer-checked:bg-[#7CAA6D] transition`
      - svg(dot indicator): `w-2.5 h-2.5 rounded-full fill-white/90 opacity-0 peer-checked:opacity-100`
    - span(text): `text-base text-[#3A3A3A]`

- **Switch/Toggle**
  - label: `flex items-center gap-3 cursor-pointer`
    - div: `relative`
      - input: `type="checkbox" class="sr-only peer"`
      - div(Toggle track): `w-12 h-6 bg-[#7CAA6D]/8 peer-checked:bg-[#7CAA6D] rounded-full transition`
      - div(Toggle thumb): `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-6 transition`
    - span(text): `text-base text-[#3A3A3A]`

- **Select/Dropdown**
  - Select container: `flex items-center gap-2 px-4 py-2.5 bg-white/85 rounded-full border border-[#E5E8E3] cursor-pointer hover:border-[#D4D9D0] transition`
    - text: `text-base text-[#3A3A3A]`
    - Dropdown icon(square container): `flex items-center justify-center w-4 h-4 bg-transparent`
      - icon: `text-sm text-[#6B6B6B]`


### Container
- **Navigation Menu - horizontal**
    - Navigation with sections/grouping:
        - Nav Container: `flex items-center justify-between w-full px-8 py-4`
        - Left Section: `flex items-center gap-8`
          - Menu Item: `flex items-center gap-2 text-base text-[#3A3A3A] hover:text-[#7CAA6D] transition cursor-pointer`
        - Right Section: `flex items-center gap-4`
          - Menu Item: `flex items-center gap-2 text-base text-[#3A3A3A] hover:text-[#7CAA6D] transition cursor-pointer`
          - Notification (if applicable): `relative flex items-center justify-center w-10 h-10 hover:bg-white/40 rounded-full transition cursor-pointer`
            - notification-icon: `w-5 h-5 text-[#3A3A3A]`
            - badge (if has unread): `absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#D9B3AD] rounded-full flex items-center justify-center`
              - badge-count: `text-xs font-semibold text-white/90`
          - Avatar(if applicable): `flex items-center gap-2 cursor-pointer`
            - avatar-image: `w-9 h-9 rounded-full object-cover border-2 border-white/60`
            - dropdown-icon (if applicable): `w-4 h-4 text-[#6B6B6B]`

- **Card**
    - Example 1 (Vertical card with image and text):
        - Card: `bg-white/85 rounded-2xl flex flex-col p-4 gap-3 shadow-[0_2px_10px_rgba(124,170,109,0.06)] hover:shadow-[0_3px_14px_rgba(124,170,109,0.10)] transition`
        - Image: `rounded-lg w-full object-cover`
        - Text area: `flex flex-col gap-2`
          - card-title: `text-lg font-semibold text-[#3A3A3A]`
          - card-subtitle: `text-sm font-normal text-[#6B6B6B]`
    - Example 2 (Horizontal card with image and text):
        - Card: `bg-white/85 rounded-2xl flex gap-4 p-4 shadow-[0_2px_10px_rgba(124,170,109,0.06)] hover:shadow-[0_3px_14px_rgba(124,170,109,0.10)] transition`
        - Image: `rounded-lg h-full w-32 object-cover flex-shrink-0`
        - Text area: `flex flex-col gap-2 flex-1`
          - card-title: `text-lg font-semibold text-[#3A3A3A]`
          - card-subtitle: `text-sm font-normal text-[#6B6B6B]`
    - Example 3 (Image-focused card: no background or padding. Avoid rounded corners on container as they cause only top corners of image to be rounded):
        - Card: `flex flex-col gap-3 hover:opacity-90 transition cursor-pointer`
        - Image: `rounded-2xl w-full object-cover`
        - Text area: `flex flex-col gap-2`
          - card-title: `text-lg font-semibold text-[#3A3A3A]`
          - card-subtitle: `text-sm font-normal text-[#6B6B6B]`
    - Example 4 (text-only cards, simple cards, such as Upgrade Card, Activity Summary Cards):
        - Card: `bg-white/85 rounded-2xl flex flex-col p-5 gap-3 shadow-[0_2px_10px_rgba(124,170,109,0.06)]`

## Additional Notes
- Maintain a relaxed, flowing rhythm throughout the interface with generous spacing
- Use the low-saturation Morandi color palette to create a calm, dreamy atmosphere
- Leverage subtle gradient backgrounds strategically—they should be barely perceptible, adding warmth without dominating
- Keep interactions smooth with gentle transitions and soft hover states
- Balance the natural green theme with neutral accent colors to prevent monotony
- Prioritize readability with adequate contrast despite the soft color palette


<colors_extraction>
#7CAA6D
#A1C493
#5F8A52
#FDFCFA
#FEFDFB
#FDFCF9
rgba(161, 196, 147, 0.08)
rgba(210, 190, 165, 0.06)
rgba(161, 196, 147, 0.06)
rgba(161, 196, 147, 0.10)
rgba(210, 190, 165, 0.08)
#FFFFFFD9
#FFFFFF99
#7CAA6D14
#7CAA6D26
#3A3A3A
#6B6B6B
#9A9A9A
#C4C4C4
#FFFFFFE6
#FFFFFFB3
#C8DFC0
#E7F3E3
#D9B3AD
#F5DDD9
#EED8B5
#F9EDCF
#7B9CB8
#C8DEEF
#9AB89A
#A3C4C4
#B8ADA3
#8BB5B5
#C4B5A8
#8D7A6B
#6B9A9A
#E5E8E3
#D4D9D0
#E8EBE6
radial-gradient(circle at 20% 30%, rgba(161, 196, 147, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(210, 190, 165, 0.06) 0%, transparent 50%), #FDFCFA
radial-gradient(circle at 15% 40%, rgba(161, 196, 147, 0.06) 0%, transparent 45%), #FEFDFB
radial-gradient(circle at 50% 20%, rgba(161, 196, 147, 0.10) 0%, transparent 60%), radial-gradient(circle at 85% 75%, rgba(210, 190, 165, 0.08) 0%, transparent 55%), #FDFCF9
radial-gradient(circle at 30% 25%, rgba(161, 196, 147, 0.08) 0%, transparent 50%), #FDFCFA
radial-gradient(circle at 60% 30%, rgba(161, 196, 147, 0.06) 0%, transparent 45%), #FEFDFB
</colors_extraction>
