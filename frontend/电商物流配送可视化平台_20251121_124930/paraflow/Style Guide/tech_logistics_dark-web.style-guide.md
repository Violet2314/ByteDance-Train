# Tech Logistics Light Style Guide

**Style Overview**:
A light, tech-focused theme centered on cyber blue, utilizing clean white and subtle gradient backgrounds to create a crisp data environment, complemented by sky blue and steel blue accents for technological hierarchy, combined with surface color contrast and soft shadows to establish refined clarity and professional depth for modern logistics data visualization.

## Colors
### Primary Colors
  - **primary-base**: `text-[#00A8E8]` or `bg-[#00A8E8]` - Cyber blue for key actions and data highlights
  - **primary-lighter**: `text-[#33BFEF]` or `bg-[#33BFEF]` - Brighter variant for hover states
  - **primary-darker**: `text-[#0088BB]` or `bg-[#0088BB]` - Deeper variant for active states

### Background Colors

#### Structural Backgrounds

Choose based on layout type:

**For Vertical Layout** (Top Header + Optional Side Panels):
- **bg-nav-primary**: `style="background: radial-gradient(circle at 30% 40%, rgba(0, 168, 232, 0.04) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(93, 173, 226, 0.03) 0%, transparent 50%), #FDFEFE;"` - Top header with subtle tech blue gradient halos
- **bg-nav-secondary**: `style="background: radial-gradient(circle at 20% 35%, rgba(0, 168, 232, 0.03) 0%, transparent 45%), #FEFEFF;"` - Inner Left sidebar (if present)
- **bg-page**: `style="background: radial-gradient(circle at 50% 25%, rgba(0, 168, 232, 0.05) 0%, transparent 60%), radial-gradient(circle at 85% 75%, rgba(93, 173, 226, 0.04) 0%, transparent 55%), #FDFDFE;"` - Page background (bg of Main Content area)

**For Horizontal Layout** (Side Navigation + Optional Top Bar):
- **bg-nav-primary**: `style="background: radial-gradient(circle at 35% 30%, rgba(0, 168, 232, 0.04) 0%, transparent 50%), #FDFEFE;"` - Left main sidebar
- **bg-nav-secondary**: `style="background: radial-gradient(circle at 60% 35%, rgba(0, 168, 232, 0.03) 0%, transparent 45%), #FEFEFF;"` - Inner Top header (if present)
- **bg-page**: `style="background: radial-gradient(circle at 50% 25%, rgba(0, 168, 232, 0.05) 0%, transparent 60%), radial-gradient(circle at 85% 75%, rgba(93, 173, 226, 0.04) 0%, transparent 55%), #FDFDFE;"` - Page background (bg of Main Content area)

#### Container Backgrounds
For main content area. Adjust values when used on navigation backgrounds to ensure sufficient contrast.
- **bg-container-primary**: `bg-white/90` - Primary data cards and panels
- **bg-container-secondary**: `bg-white/70` - Secondary information containers
- **bg-container-inset**: `bg-[#00A8E8]/6` - Subtle highlights for inset areas
- **bg-container-inset-strong**: `bg-[#00A8E8]/12` - Stronger emphasis for selected states

### Text Colors
- **color-text-primary**: `text-[#1A2A35]` - Primary text on light backgrounds
- **color-text-secondary**: `text-[#4A5A65]` - Secondary text and labels
- **color-text-tertiary**: `text-[#7A8A95]` - Tertiary text and placeholders
- **color-text-quaternary**: `text-[#AAB5BE]` - Disabled states and subtle hints
- **color-text-on-dark-primary**: `text-white/95` - Text on dark backgrounds and primary-base color surfaces
- **color-text-on-dark-secondary**: `text-white/75` - Secondary text on dark backgrounds and primary-base color surfaces
- **color-text-link**: `text-[#00A8E8]` - Links and clickable text

### Functional Colors
Use **sparingly** to maintain focus on data visualization. Used for status indicators, alerts, and critical actions.
  - **color-success-default**: `#00C48C` - Success states, delivered status
  - **color-success-light**: `#00C48C33` - Success tag/label bg
  - **color-error-default**: `#FF6B6B` - Error states, failed deliveries
  - **color-error-light**: `#FF6B6B33` - Error tag/label bg
  - **color-warning-default**: `#FFB800` - Warning states, delays
  - **color-warning-light**: `#FFB80033` - Warning tag/label bg
  - **color-function-default**: `#7C3AED` - Special functions and premium features
  - **color-function-light**: `#7C3AED33` - Function tag/label bg

### Accent Colors
  - A secondary palette for technological hierarchy and data categorization. **Use strategically** to maintain brand identity.
  - **accent-sky-blue**: `text-[#5DADE2]` or `bg-[#5DADE2]` - Sky blue for secondary highlights
  - **accent-steel-blue**: `text-[#5499C7]` or `bg-[#5499C7]` - Steel blue for tertiary emphasis
  - **accent-electric-blue**: `text-[#3498DB]` or `bg-[#3498DB]` - Electric blue for active data points

### Data Visualization Charts
For data visualization charts only.
  - Primary data series: #00A8E8, #5DADE2, #5499C7, #3498DB, #2E86AB, #1B4965
  - Secondary data series: #00C48C, #48D597, #7BE0AC, #A8EBC1
  - Alert/Critical data: #FF6B6B, #FF8787, #FFA5A5
  - Neutral data: #6B7280, #9CA3AF, #D1D5DB

## Typography
- **Font Stack**:
  - **font-family-base**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` — For regular UI copy

- **Font Size & Weight**:
  - **Caption**: `text-sm font-normal` - 14px for data labels and metadata
  - **Body**: `text-base font-normal` - 16px for standard text
  - **Body Emphasized**: `text-base font-semibold` - 16px for emphasized content
  - **Card Title / Subtitle**: `text-lg font-semibold` - 18px for card headers
  - **Page Title**: `text-2xl font-semibold` - 24px for page headings
  - **Headline**: `text-3xl font-semibold` - 30px for major headlines
  - **Data Display Large**: `text-4xl font-bold` - 36px for key metrics

- **Line Height**: 1.5

## Border Radius
  - **Small**: 8px — Data points, small tags, badges
  - **Medium**: 12px — Buttons, inputs, small cards
  - **Large**: 16px — Data cards, panels, containers
  - **Extra Large**: 20px — Major feature cards, dashboard widgets
  - **Full**: full — Avatars, status indicators, toggles

## Layout & Spacing
  - **Tight**: 8px - Icon-text gaps within buttons
  - **Compact**: 12px - Small element gaps like status badges
  - **Standard**: 16px - Card internal padding, list item gaps
  - **Comfortable**: 24px - Section spacing within cards
  - **Relaxed**: 32px - Major container gaps
  - **Section**: 48px - Dashboard section divisions

## Create Boundaries (contrast of surface color, borders, shadows)
Utilizes progressive surface color differences combined with soft shadows to create technological depth and refined visual hierarchy.

### Borders
  - **Case 1**: For most containers, no borders are used.
  - **Case 2**: For emphasis or input elements
    - **Default**: 1px solid rgba(0, 168, 232, 0.15). Used for inputs, dividers. `border border-[#00A8E8]/15`
    - **Stronger**: 1px solid rgba(0, 168, 232, 0.25). Used for active states. `border border-[#00A8E8]/25`
    - **Accent**: 1px solid #00A8E8. Used for focused states. `border border-[#00A8E8]`

### Dividers
  - **Standard**: `border-t border-[#00A8E8]/10` or `border-b border-[#00A8E8]/10` - Subtle separation
  - **Stronger**: `border-t border-[#00A8E8]/15` - Emphasized divisions

### Shadows & Effects
  - **Case 1 (Subtle elevation)**: `shadow-[0_2px_8px_rgba(0,168,232,0.08)]` - Small cards, buttons
  - **Case 2 (Moderate elevation)**: `shadow-[0_4px_16px_rgba(0,168,232,0.12)]` - Data cards, panels
  - **Case 3 (Pronounced elevation)**: `shadow-[0_8px_24px_rgba(0,168,232,0.15)]` - Modals, overlays
  - **Case 4 (Glow effect)**: `shadow-[0_0_16px_rgba(0,168,232,0.25)]` - Active data visualization elements

## Visual Emphasis for Containers
When containers (tags, cards, list items, rows) need visual emphasis to indicate priority, status, or category, use the following techniques:

| Technique | Implementation Notes | Best For | Avoid |
|-----------|---------------------|----------|-------|
| Background Tint | Use darker/lighter variants of container backgrounds or add subtle primary color tint | Status differentiation, priority levels | Overuse on large areas |
| Border Highlight | Apply thin accent border (1px solid #00A8E8 or rgba(0,168,232,0.5)) | Active states, selected items | Default state of many elements |
| Glow/Shadow Effect | Use subtle colored shadows matching functional/accent colors | Real-time updates, critical alerts | Static content |
| Status Tag/Label | Add small colored tag inside container with functional colors | Delivery status, tracking stages | Redundant with other emphasis |
| Side Accent Bar | 3px left border with functional/accent color | List items, notification cards, tracking events | Rounded containers |

## Assets
### Image
  - For normal `<img>`: object-cover
  - For `<img>` with:
    - Slight overlay: object-cover brightness-95
    - Heavy overlay: object-cover brightness-75

### Icon
- Use Lucide icons from Iconify for clean, modern line icons.
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
  - **Graphic**: Use a simple, relevant icon (e.g., a `truck` icon for logistics platform, a `package` icon for delivery service).

## Page Layout - Web (*EXTREMELY* important)
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
<body class="w-[1440px] min-h-[900px] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif] leading-[1.5]">

  <!-- Header (Primary Nav): Fixed height -->
  <header class="w-full">
    <!-- Header content -->
  </header>

  <!-- Content Container: Must include 'flex' class -->
  <div class="w-full flex min-h-[900px]">
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
<body class="w-[1440px] min-h-[900px] flex font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif] leading-[1.5]">

<!-- Left Sidebar (Primary Nav): Use its ml to control left page margin -->
  <aside class="flex-shrink-0 min-w-fit">
  </aside>

  <!-- Content Container-->
  <div class="flex-1 overflow-x-hidden flex flex-col min-h-[900px]">

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
  - Example 1 (Primary button):
    - button: flex items-center gap-2 bg-[#00A8E8] hover:bg-[#0088BB] text-white/95 px-6 py-3 rounded-xl transition
      - icon (optional)
      - span(button copy): whitespace-nowrap font-semibold
  - Example 2 (Secondary button):
    - button: flex items-center gap-2 bg-white/70 hover:bg-white/90 text-[#1A2A35] border border-[#00A8E8]/15 px-6 py-3 rounded-xl transition
      - icon (optional)
      - span(button copy): whitespace-nowrap font-semibold
  - Example 3 (Text button):
    - button: flex items-center gap-2 text-[#00A8E8] hover:text-[#0088BB] transition
      - span(button copy): whitespace-nowrap

- **Tag Group (Filter Tags)** (Note: `overflow-x-auto` and `whitespace-nowrap` are required)
  - container(scrollable): flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden
    - label (Tag item 1):
      - input: type="radio" name="tag1" class="sr-only peer" checked
      - div: bg-white/70 text-[#4A5A65] px-4 py-2 rounded-lg peer-checked:bg-[#00A8E8] peer-checked:text-white/95 hover:bg-white/90 transition whitespace-nowrap border border-[#00A8E8]/10

### Data Entry
- **Progress bars/Slider**: h-2 bg-[#00A8E8]/10 rounded-full
  - div(progress fill): bg-[#00A8E8] h-full rounded-full transition-all

- **Checkbox**
  - label: flex items-center gap-3
    - input: type="checkbox" class="sr-only peer"
    - div: w-5 h-5 bg-[#00A8E8]/6 rounded-md flex items-center justify-center peer-checked:bg-[#00A8E8] text-transparent peer-checked:text-white/95 border border-[#00A8E8]/10 transition
      - svg(Checkmark): stroke="currentColor" stroke-width="3"
    - span(text): text-[#4A5A65]

- **Radio button**
  - label: flex items-center gap-3
    - input: type="radio" name="option1" class="sr-only peer"
    - div: w-5 h-5 bg-[#00A8E8]/6 rounded-full flex items-center justify-center peer-checked:bg-[#00A8E8] border border-[#00A8E8]/10 transition
      - svg(dot indicator): fill="white" opacity="0" peer-checked:opacity="100" w-2 h-2
    - span(text): text-[#4A5A65]

- **Switch/Toggle**
  - label: flex items-center gap-3
    - div: relative
      - input: type="checkbox" class="sr-only peer"
      - div(Toggle track): w-12 h-6 bg-[#00A8E8]/10 peer-checked:bg-[#00A8E8] rounded-full transition border border-[#00A8E8]/10
      - div(Toggle thumb): absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-6 transition shadow-sm
    - span(text): text-[#4A5A65]

- **Select/Dropdown**
  - Select container: flex items-center gap-2 bg-white/70 px-4 py-3 rounded-xl border border-[#00A8E8]/15
    - text: text-[#1A2A35]
    - Dropdown icon(square container): flex items-center justify-center bg-transparent w-5 h-5
      - icon: text-[#7A8A95]

### Container
- **Navigation Menu - horizontal**
    - Navigation with sections/grouping:
        - Nav Container: flex items-center justify-between w-full px-8 py-4
        - Left Section: flex items-center gap-12
          - Menu Item: flex items-center gap-2 text-[#4A5A65] hover:text-[#00A8E8] transition
            - icon (optional)
            - text
        - Right Section: flex items-center gap-6
          - Menu Item: flex items-center gap-2 text-[#4A5A65] hover:text-[#00A8E8] transition
          - Notification (if applicable): relative flex items-center justify-center w-10 h-10
            - notification-icon: w-5 h-5 text-[#4A5A65]
            - badge (if has unread): absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B6B] flex items-center justify-center
              - badge-count: text-xs font-semibold text-white
          - Avatar(if applicable): flex items-center gap-3
            - avatar-image: w-9 h-9 rounded-full border-2 border-[#00A8E8]/15
            - dropdown-icon (if applicable): w-5 h-5 text-[#7A8A95]

- **Card**
    - Example 1 (Data card with metric):
        - Card: bg-white/90 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_4px_16px_rgba(0,168,232,0.12)] border border-[#00A8E8]/5
        - Header: flex items-center justify-between
          - card-title: text-lg font-semibold text-[#1A2A35]
          - icon: w-5 h-5 text-[#00A8E8]
        - Metric: text-4xl font-bold text-[#1A2A35]
        - Subtitle: text-sm text-[#7A8A95]

    - Example 2 (Tracking card with status):
        - Card: bg-white/90 rounded-xl p-5 flex gap-4 shadow-[0_2px_8px_rgba(0,168,232,0.08)] border border-[#00A8E8]/5 hover:border-[#00A8E8]/15 transition
        - Icon area: w-12 h-12 bg-[#00A8E8]/6 rounded-lg flex items-center justify-center
          - icon: w-6 h-6 text-[#00A8E8]
        - Text area: flex-1 flex flex-col gap-2
          - card-title: text-base font-semibold text-[#1A2A35]
          - card-subtitle: text-sm text-[#4A5A65]
          - status-badge: px-3 py-1 bg-[#00C48C33] text-[#00C48C] rounded-full text-xs font-medium w-fit

    - Example 3 (Image-based card):
        - Card: flex flex-col gap-4
        - Image: rounded-2xl w-full h-48 shadow-[0_4px_16px_rgba(0,168,232,0.12)]
        - Text area: flex flex-col gap-2
          - card-title: text-lg font-semibold text-[#1A2A35]
          - card-subtitle: text-sm text-[#4A5A65]

- **Table Row (Dashboard/Data Display)**
    - Table: w-full
      - thead: border-b border-[#00A8E8]/10
        - tr
          - th: text-left py-4 px-4 text-sm font-semibold text-[#4A5A65]
      - tbody
        - tr: border-b border-[#00A8E8]/5 hover:bg-white/70 transition
          - td: py-4 px-4 text-base text-[#1A2A35]

## Additional Notes

**Data Visualization Integration:**
- Charts should use the specified data visualization color palette
- Real-time data updates should include subtle glow effects using `shadow-[0_0_16px_rgba(0,168,232,0.25)]`
- Interactive data points should respond to hover with brightness and scale transitions

**Performance Considerations:**
- Large datasets should use optimized rendering techniques
- Real-time tracking updates should be smooth and non-disruptive
- Dashboard widgets should load progressively to maintain responsiveness

**Accessibility:**
- Maintain WCAG AA contrast ratios for all text (already satisfied with dark text on light backgrounds)
- Provide keyboard navigation for all interactive elements
- Include aria-labels for data visualization elements

**Design Philosophy:**
- Clean, modern light interface that emphasizes clarity and professionalism
- Subtle tech-blue gradient backgrounds add depth without overwhelming content
- Strategic use of white space and transparency creates visual hierarchy
- Maintain focus on data presentation with minimal visual distractions

<colors_extraction>
#00A8E8
#33BFEF
#0088BB
#FDFEFE
#FEFEFF
#FDFDFE
rgba(0, 168, 232, 0.04)
rgba(93, 173, 226, 0.03)
rgba(0, 168, 232, 0.03)
rgba(0, 168, 232, 0.05)
rgba(93, 173, 226, 0.04)
#FFFFFFE6
#FFFFFFB3
#00A8E80F
#00A8E81F
#1A2A35
#4A5A65
#7A8A95
#AAB5BE
#FFFFFFF2
#FFFFFFBF
#00C48C
#00C48C33
#FF6B6B
#FF6B6B33
#FFB800
#FFB80033
#7C3AED
#7C3AED33
#5DADE2
#5499C7
#3498DB
#2E86AB
#1B4965
#48D597
#7BE0AC
#A8EBC1
#FF8787
#FFA5A5
#6B7280
#9CA3AF
#D1D5DB
rgba(0, 168, 232, 0.15)
rgba(0, 168, 232, 0.25)
rgba(0, 168, 232, 0.08)
rgba(0, 168, 232, 0.12)
rgba(0, 168, 232, 0.15)
rgba(0, 168, 232, 0.25)
#00A8E826
#00A8E80D
</colors_extraction>
