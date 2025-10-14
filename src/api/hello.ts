const helloRoutes = {
	"/hello": {
		async GET(_req: Request) {
			return Response.json({
				message: "Hello, world!",
				method: "GET",
			});
		},
		async PUT(_req: Request) {
			return Response.json({
				message: "Hello, world!",
				method: "PUT",
			});
		},
	},

	"/hello/:name": async (req: any) => {
		const name = req.params.name;
		return Response.json({
			message: `Hello, ${name}!`,
		});
	},
};

export default helloRoutes;
