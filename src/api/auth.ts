import { prisma } from "../lib/prisma";

const authRoutes = {
	"/login": async (req: Request) => {
		if (req.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		try {
			const { email, password } = await req.json();

			if (!email || !password) {
				return Response.json(
					{ error: "Email and password required" },
					{ status: 400 },
				);
			}

			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user) {
				return Response.json({ error: "Invalid credentials" }, { status: 401 });
			}

			// Simple password check (in production, use bcrypt)
			if (!(await Bun.password.verify(password, user.password, "bcrypt"))) {
				return Response.json({ error: "Invalid credentials" }, { status: 401 });
			}

			// Set auth cookie
			const response = Response.json({
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
				},
			});

			response.headers.set(
				"Set-Cookie",
				`auth-token=${user.id}; HttpOnly; Path=/; SameSite=Strict`,
			);
			return response;
		} catch (_error) {
			return Response.json({ error: "Login failed" }, { status: 500 });
		}
	},

	"/logout": async (req: Request) => {
		if (req.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		const response = Response.json({ success: true });
		response.headers.set(
			"Set-Cookie",
			"auth-token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0",
		);
		return response;
	},

	"/register": async (req: Request) => {
		if (req.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		try {
			const { email, password, confirmPassword, name } = await req.json();

			if (!email || !password) {
				return Response.json(
					{ error: "Email and password required" },
					{ status: 400 },
				);
			}

			if (password !== confirmPassword) {
				return Response.json(
					{ error: "Passwords do not match" },
					{ status: 400 },
				);
			}

			// Check if user already exists
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				return Response.json({ error: "User already exists" }, { status: 409 });
			}

			// Create new user (in production, hash the password)
			const user = await prisma.user.create({
				data: {
					id: `user_${Date.now()}`,
					email,
					password: await Bun.password.hash(password, {
						cost: 4,
						algorithm: "bcrypt",
					}),
					name,
				},
			});

			const response = Response.json({
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
				},
			});

			response.headers.set(
				"Set-Cookie",
				`auth-token=${user.id}; HttpOnly; Path=/; SameSite=Strict`,
			);
			return response;
		} catch (_error) {
			return Response.json({ error: "Registration failed" }, { status: 500 });
		}
	},
};

export { authRoutes };
