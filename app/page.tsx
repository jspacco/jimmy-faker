import fs from "fs";
import path from "path";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const personasDir = path.join(process.cwd(), "personas");

  let personaNames: string[] = [];

  try {
    const files = fs.readdirSync(personasDir);

    personaNames = files
      .filter((file) => file.endsWith(".txt"))
      .map((file) => file.replace(".txt", ""))
      .sort();
  } catch (err) {
    console.error("Failed to read personas folder:", err);
  }

  return (
    <main className="home-page">
      <div className="home-card">
        <h1>Fake Client Interviews</h1>
        <p className="subtitle">Select a persona to begin:</p>

        <div className="persona-grid">
          {personaNames.map((name) => (
            <Link key={name} href={`/${name}`} className="persona-card">
              <div className="persona-name">{name}</div>
              <div className="persona-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
