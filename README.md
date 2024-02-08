# react-messenger

Simple messaging app built on a Next.js frontend with an Express backend, using Github authentication services (OAuth Apps).

This project was a great introduction to the world of third-party auth providers, as well as a huge help to familiarize myself with a simple potential login/logout user flow in a React application. Learned a lot of do's and dont's of access tokens. HttpOnly cookies for the win!

Tech Stack:
- Typescript
- Express.js
- Next.js (React)
- Tailwind CSS

(TENT stack?)

## Installing

1. Run `install.bat`

or

1. Run `npm run install-link` in `shared/`
2. Run `npm run install-link` in `frontend/` and `backend/`

## Running / Development

There must exist an `.env` file in `backend/` with the following properties:
- `PORT` - Backend server port
- `CLIENT_ID` - Github OAuth app client ID (see [Resources](#Resources))
- `CLIENT_SECRET` - Github OAuth app client secret (see [Resources](#Resources))

---

1. Run `dev.bat /ob`

or

1. Run `npm run dev` in `backend/`, `frontend/` and `shared/`
2. Open up http://localhost:3000

## Resources

- [Github - OAuth Apps](https://docs.github.com/en/apps/oauth-apps)
- [Github User API](https://docs.github.com/en/rest/users?apiVersion=2022-11-28)
