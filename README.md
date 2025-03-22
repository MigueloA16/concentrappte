# Focus Timer App

A science-backed focus timer that helps you get more done through collaborative study sessions, friendly competition, and progress tracking.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui
- **Backend & Database:** Supabase (Authentication, Database, Real-time subscriptions)

## Features

- **Focus Timer:** Customizable timer based on the Pomodoro technique
- **Study Rooms:** Collaborative spaces for focused work and accountability
- **Progress Tracking:** Visualize your productivity over time
- **User Authentication:** Secure user accounts and profiles

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd focus-timer-app
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up Supabase**

- Create a new project in [Supabase](https://supabase.com)
- Get your project URL and anon key from the project settings
- Create a `.env.local` file in the root directory with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up the database schema**

- Go to the SQL Editor in your Supabase dashboard
- Paste and run the SQL schema from `supabase-schema.sql`

5. **Run the development server**

```bash
npm run dev
# or
yarn dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
focus-timer-app/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Dashboard and app features
│   └── page.tsx            # Landing page
├── components/             # Reusable components
│   ├── auth/               # Authentication components
│   └── ui/                 # UI components
├── lib/                    # Utility functions and libraries
│   └── supabase/           # Supabase client and types
├── public/                 # Static assets
└── ...                     # Configuration files
```

## Development

### Adding New UI Components

```bash
npx shadcn-ui@latest add <component-name>
```

### Database Schema

The app uses the following main tables:

- `profiles`: User profile information
- `focus_sessions`: Individual focus sessions
- `study_rooms`: Virtual rooms for collaborative studying
- `room_participants`: Tracks users' participation in study rooms

### Authentication Flow

The app uses Supabase Auth with email/password authentication. The authentication flow includes:

1. Sign up with email/password
2. Email verification
3. Sign in
4. Protected routes via middleware

## Deployment

This project can be deployed to Vercel:

```bash
npm run build
# or
vercel
```

## License

[MIT](LICENSE)