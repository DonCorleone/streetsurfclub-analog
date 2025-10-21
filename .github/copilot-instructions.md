# Copilot Instructions for streetsurfclub-analog

## Project Overview
This is a **dual-architecture Angular project** combining:
1. **Analog.js** (Angular 20 + Vite) - Modern fullstack meta-framework in `/src`
2. **Legacy Canora** (Angular 17 + CLI) - Traditional Angular app in `/canora`

The root project uses Analog for file-based routing and SSR. The `canora` subfolder is a standalone Angular 17 template with 5 AI-themed landing pages.

## Critical Architecture Patterns

### Two Distinct Angular Worlds
- **Root (`/src`)**: Uses Analog.js with standalone components, file-based routing via `@analogjs/router`, and Vite
  - Components use `export default class` with `@Component` decorator
  - Pages live in `src/app/pages/*.page.ts` (e.g., `index.page.ts`)
  - No `NgModule` - imports directly in component decorator
  - Example: `src/app/pages/index.page.ts` imports `AnalogWelcome` component
  
- **Canora (`/canora`)**: Traditional NgModule-based Angular 17 with Angular CLI
  - Uses `@NgModule` with declarations array (`canora/src/app/app.module.ts` declares 70+ components)
  - Routing via `AppRoutingModule` with explicit path mapping
  - Components follow `*.component.ts|html|scss` structure
  - Example: 5 landing pages (noise-cancelling, chatbot, writer, profile-maker, digital-marketing)

### Routing Strategy Differences
**Analog (root)**: File-based routing - create `src/app/pages/foo.page.ts` for `/foo` route
**Canora**: Explicit routes in `canora/src/app/app-routing.module.ts` mapping paths to components

### Server-Side API Routes
- API endpoints: `src/server/routes/api/v1/*.ts`
- Use h3's `defineEventHandler` (see `hello.ts` example)
- Accessible at `/api/v1/<filename>`

## Build & Development Workflows

### Root Project (Analog)
```bash
npm start           # Dev server on http://localhost:5173 (Vite)
npm run build       # SSR build → dist/analog/{public,server}
npm run preview     # Preview SSR build
npm test            # Vitest with jsdom
```

### Canora Subfolder
```bash
cd canora
npm start           # Dev server on http://localhost:4200
npm run build       # Production build
npm test            # Karma/Jasmine tests
```

**Key**: The root project uses Vite + Vitest, while Canora uses Angular CLI + Karma. Don't mix build commands.

## Styling & UI Dependencies

### Root: Tailwind CSS v4
- Configured via `@tailwindcss/vite` plugin in `vite.config.ts`
- Import in `src/styles.css`: `@import 'tailwindcss';`
- No `tailwind.config.js` needed (v4 convention)

### Canora: Tailwind CSS v3 + Specialty Libraries
- Config: `canora/tailwind.config.js`
- UI libraries: `ngx-owl-carousel-o`, `ngx-scrolltop`, AOS animations, Remixicon
- `AppComponent` initializes AOS in constructor

## Component Conventions

### Analog Components (Root)
- Standalone components with inline templates/styles
- Use `imports` array in `@Component` decorator
- Example pattern:
  ```typescript
  @Component({
    selector: 'app-foo',
    imports: [AnalogWelcome],
    template: `<app-analog-welcome/>`
  })
  export default class FooComponent {}
  ```

### Canora Components
- Modular structure: `feature-name/component-name/component-name.component.{ts,html,scss}`
- Prefixed naming: `acl-*` (chatbot), `ancal-*` (noise-cancelling), `awcl-*` (writer), etc.
- All declared in central `app.module.ts`

## Configuration Files

### Root Project
- `vite.config.ts`: Analog + Tailwind plugins, Vitest config
- `angular.json`: Uses `@analogjs/platform:vite` builder (not standard Angular builder)
- `src/app/app.config.ts`: Providers for Analog router, HTTP client with SSR interceptor, client hydration

### Canora
- Standard Angular CLI workspace structure
- `canora/angular.json`: Uses `@angular-devkit/build-angular`

## When Adding Features

**To root project**: Create `src/app/pages/your-feature.page.ts` - route auto-generated  
**To Canora**: 
1. Generate component in appropriate landing folder
2. Add to `app.module.ts` declarations
3. Add route to `app-routing.module.ts`

## Testing
- Root uses **Vitest** with `src/test-setup.ts` and `@analogjs/vitest-angular`
- Canora uses **Karma/Jasmine** (traditional Angular testing)
- Test files: `*.spec.ts` in both projects

## Dependencies to Know
- **Analog**: `@analogjs/router`, `@analogjs/content`, `@analogjs/platform`
- **SSR**: `@angular/platform-server`, `provideClientHydration(withEventReplay())`
- **Node version**: `>=20.19.1` (from package.json engines)
