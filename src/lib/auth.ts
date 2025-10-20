// Extract user ID from cookie
export function getCurrentUserId(req: Request): string {
	const cookieHeader = req.headers.get("Cookie");
	if (!cookieHeader) {
		throw new Response(JSON.stringify({ error: "Authentication required" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Parse auth-token from cookies
	const cookies = cookieHeader.split(";").map((c) => c.trim());
	const authCookie = cookies.find((c) => c.startsWith("auth-token="));

	if (!authCookie) {
		throw new Response(JSON.stringify({ error: "Authentication required" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const userId = authCookie.split("=")[1];
	if (!userId) {
		throw new Response(JSON.stringify({ error: "Invalid token" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	return userId;
}
