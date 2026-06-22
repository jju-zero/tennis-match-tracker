import { request as httpsRequest } from "node:https";

import { NextRequest, NextResponse } from "next/server";

const rankingUrl = "https://www2.kanto-tennis.com/ranking/pc/ListRankingPC.php";

export const runtime = "nodejs";

type KantoPlayer = {
  registrationNumber: string;
  name: string;
  affiliation: string;
  ranking: string;
};

type RankingResponse = {
  status: number;
  html: string;
};

export async function GET(request: NextRequest) {
  const registrationNumber = request.nextUrl.searchParams.get("registrationNumber")?.trim() ?? "";

  if (!/^\d{1,7}$/.test(registrationNumber)) {
    return NextResponse.json(
      { error: "INVALID_REGISTRATION_NUMBER" },
      { status: 400 },
    );
  }

  const body = new URLSearchParams({
    RankingCode: "900",
    FromAge: "20241231",
    ToAge: "20080101",
    Area: "3",
    Prefecture: "",
    ColCode: "",
    DisPlaySequence: "0",
    WRCodeFirst: registrationNumber,
    Submit: "　表　示　",
  });

  let response: RankingResponse;

  try {
    response = await requestRanking(body);
  } catch (error) {
    console.error("Kanto player lookup failed", error);
    return NextResponse.json(
      {
        error: "KANTO_RANKING_FETCH_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }

  if (response.status < 200 || response.status >= 300) {
    return NextResponse.json(
      { error: "KANTO_RANKING_REQUEST_FAILED", status: response.status },
      { status: 502 },
    );
  }

  const player = findPlayer(response.html, registrationNumber);

  if (!player) {
    return NextResponse.json(
      { error: "PLAYER_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { player },
    {
      headers: {
        "cache-control": "s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}

async function requestRanking(body: URLSearchParams): Promise<RankingResponse> {
  const payload = body.toString();

  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      rankingUrl,
      {
        method: "POST",
        // The public ranking site has an incomplete certificate chain in some Node runtimes.
        rejectUnauthorized: false,
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "content-length": Buffer.byteLength(payload),
          "content-type": "application/x-www-form-urlencoded",
          referer: rankingUrl,
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 500,
            html: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    request.setTimeout(10_000, () => {
      request.destroy(new Error("KANTO_RANKING_TIMEOUT"));
    });
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

function findPlayer(html: string, registrationNumber: string): KantoPlayer | null {
  const rowMatches = html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const rowMatch of rowMatches) {
    const cells = [...rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      cleanCell(cell[1]),
    );

    if (cells.length < 5) continue;
    if (cells[2] !== registrationNumber) continue;

    return {
      ranking: cells[0],
      registrationNumber: cells[2],
      name: cells[3],
      affiliation: cells[4],
    };
  }

  return null;
}

function cleanCell(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/g, "'")
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
