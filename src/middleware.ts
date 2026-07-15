import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  // Всё под /admin, кроме /admin/login
  matcher: ["/admin/((?!login).*)"],
};
