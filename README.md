# Pitch Perfect

## Description

Pitch Perfect is an AI-powered platform designed to help users practice, receive feedback, and perfect their pitches. It provides tools for recording pitches, analyzing speech, and visualizing skills.

## Project Structure

-   `.eslintrc.json`: Configuration file for ESLint, a JavaScript linter.
-   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
-   `next-env.d.ts`: TypeScript declaration file for Next.js environment variables.
-   `next.config.js`: Configuration file for Next.js.
-   `package-lock.json`: Records the exact versions of dependencies used in the project.
-   `package.json`: Contains metadata about the project, including dependencies and scripts.
-   `postcss.config.js`: Configuration file for PostCSS, a CSS transformation tool.
-   `project-structure.ts`: Likely contains a data structure representing the project's structure.
-   `tailwind.config.js`: Configuration file for Tailwind CSS, a CSS framework.
-   `tsconfig.json`: Configuration file for TypeScript.
-   `app/`: Directory likely containing application-specific code.
-   `components/`: Directory containing React components.
    -   `dashboard/`: Contains the `Dashboard` component.
    -   `onboarding/`: Contains onboarding-related components.
    -   `pitch/`: Contains pitch-related components.
    -   `ui/`: Contains user interface components.
    -   `visualization/`: Contains data visualization components.
-   `pages/`: Directory containing Next.js pages.
    -   `_app.tsx`: Custom App component in Next.js.
    -   `_document.js`: Custom Document component in Next.js.
    -   `dashboard.tsx`: Dashboard page.
-   `services/`: Directory containing services.
    -   `analysis/`: Contains analysis-related services.
        -   `SpeechAnalysisService.ts`: Service for analyzing speech.
-   `styles/`: Directory containing CSS styles.
    -   `globals.css`: Global CSS styles.

## Dependencies

The project uses the following main dependencies:

-   React
-   Next.js
-   Tailwind CSS

## Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install` or `yarn install`.
3.  Run the development server: `npm run dev` or `yarn dev`.
4.  Open <http://localhost:3000> in your browser.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

[MIT](https://opensource.org/licenses/MIT)
