import db from "../db/index";

export const programsRoutes = {
  // Get all programs without exercises
  "/programs": {
    async GET() {
      const programs = db
        .prepare("SELECT * FROM programs ORDER BY created_at ASC")
        .all();

      return Response.json(programs);
    },

    async POST(req: Request) {
      const { name } = await req.json();
      const id = Date.now().toString();

      db.prepare("INSERT INTO programs (id, name) VALUES (?, ?)").run(id, name);

      return Response.json({ id, name });
    },
  },

  // Get program exercises
  "/programs/:id": {
    async GET(req: any) {
      const id = req.params.id;
      const exercises = db
        .prepare(
          "SELECT * FROM exercises WHERE program_id = ? ORDER BY created_at"
        )
        .all(id);

      return Response.json(exercises);
    },
    async PUT(req: any) {
      const { name } = await req.json();
      const id = req.params.id;

      db.prepare("UPDATE programs SET name = ? WHERE id = ?").run(name, id);

      return Response.json({ success: true });
    },

    async DELETE(req: any) {
      const id = req.params.id;

      db.prepare("DELETE FROM programs WHERE id = ?").run(id);

      return Response.json({ success: true });
    },
  },

  // Add exercise to program
  "/programs/:id/exercises": {
    async POST(req: any) {
      const { name, sets, reps, weight } = await req.json();
      const program_id = req.params.id;
      const id = Date.now().toString();

      db.prepare(
        "INSERT INTO exercises (id, program_id, name, sets, reps, weight) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(id, program_id, name, sets, reps, weight);

      return Response.json({ id, program_id, name, sets, reps, weight });
    },
  },

  // Delete exercise
  "/exercises/:id": {
    async DELETE(req: any) {
      const id = req.params.id;

      db.prepare("DELETE FROM exercises WHERE id = ?").run(id);

      return Response.json({ success: true });
    },
  },
};
