# Admin-IITS Dashboard

Admin Dashboard built with Next.js and Supabase for managing users, teams, and more.

## Technologies Used

- **Frontend:** Next.js 14 with App Router
- **Backend:** Supabase
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS

## Features

- User Management (CRUD)
- Role-based Access Control
- Team Management
- Real-time Updates
- Responsive Design

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/luonghoang3/Admin-iits.git
cd Admin-iits
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the frontend directory with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable components
│   ├── lib/                    # Library code
│   ├── modules/                # Feature modules
│   └── utils/                  # Utility functions
├── public/                     # Static assets
└── package.json               # Dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.