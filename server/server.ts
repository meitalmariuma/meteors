import express from "express";
import cors from "cors";
import pg from "pg";
import routes from "./routes";
const initialData = require("./initialData.json");

interface MeteorFromJSON {
  id: number;
  name: string;
  year: string;
  mass: number;
  reclat?: number;
  reclong?: number;
  recclass?: string;
}

const PORT = 5000;

const { Client } = pg;

const client = new Client({
  user: "postgres",
  host: "db",
  database: "postgres",
  password: "1234",
  port: 5432,
});

async function initializeDatabase(client: pg.Client) {
  try {
    await client.connect();
    await client.query(
      "CREATE TABLE IF NOT EXISTS meteor_fall (id INT PRIMARY KEY, name VARCHAR (255) NOT NULL, year INT NOT NULL, mass DECIMAL NOT NULL, reclat DECIMAL NULL, reclong DECIMAL NULL, recclass VARCHAR (50) NULL)"
    );
    await client.query("DELETE FROM meteor_fall");

    const validData = initialData.filter(
      (row: MeteorFromJSON) => row.id && row.name && row.year && row.mass
    );
    const insertQuery = `INSERT INTO meteor_fall (id, name, year, mass, reclat, reclong, recclass) VALUES ${validData
      .map(
        (row: MeteorFromJSON) =>
          `(${row.id}, '${row.name}', ${row.year!.split("-")[0]}, ${
            row.mass
          }, ${row.reclat || "NULL"}, ${row.reclong || "NULL"}, '${
            row.recclass || "NULL"
          }')`
      )
      .join(", ")}`;
    await client.query(insertQuery);
  } catch (error) {
    console.error("Database initialization failed:", error);
    console.error(
      "If recieving a connection refused, please go to the meteors/data folder and change the scram-sha-256 algorithm in pg_hba.conf to trust"
    );
  }
}

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/v1", routes);

initializeDatabase(client).then(() => {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});

export { client };
