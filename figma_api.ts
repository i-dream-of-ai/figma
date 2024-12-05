function getFigmaApiKey() {
  const apiKey = process.env.FIGMA_API_KEY;
  if (!apiKey) {
    throw new Error("FIGMA_API_KEY is not set");
  }
  return apiKey;
}

export function parseKeyFromUrl(url: string) {
  // Extract key from URLs like:
  // https://www.figma.com/board/vJzJ1oVCzowAKAayQJx6Ug/...
  // https://www.figma.com/design/8SvxepW26v4d0AyyTAw23c/...
  // https://www.figma.com/file/8SvxepW26v4d0AyyTAw23c/...
  const matches = url.match(/figma\.com\/(?:board|design|file)\/([^/?]+)/);
  if (matches) {
    return matches[1];
  }
  throw new Error("Could not parse Figma key from URL");
}

type FigNode = {
  id: string;
  name: string;
  type: string;
  children?: FigNode[];
};

type FigFile = {
  name: string;
  version: string;
  document: FigNode;
  thumbnailUrl: string;
  thumbnailB64: string;
};

export function getCanvasIds(figFileJson: FigNode) {
  const canvasIds: string[] = [];
  if (figFileJson.type === "CANVAS") {
    canvasIds.push(figFileJson.id);
  }
  if (figFileJson.children) {
    for (const child of figFileJson.children) {
      canvasIds.push(...getCanvasIds(child));
    }
  }
  return canvasIds;
}

export async function downloadFigmaFile(key: string): Promise<FigFile> {
  const response = await fetch(`https://api.figma.com/v1/files/${key}`, {
    headers: {
      "X-FIGMA-TOKEN": getFigmaApiKey(),
    },
  });
  const data = await response.json();
  return {
    ...data,
    thumbnailB64: await imageUrlToBase64(data.thumbnailUrl),
  };
}

async function getThumbnails(key: string, ids: string[]): Promise<{ [id: string]: string }> {
  const thumbnails = await fetch(
    `https://api.figma.com/v1/images/${key}?ids=${ids.join(",")}&format=png&page_size=1`,
    {
      headers: {
        "X-FIGMA-TOKEN": getFigmaApiKey(),
      },
    }
  );
  const data = (await thumbnails.json()) as { images: { [id: string]: string }; err?: string };
  if (data.err) {
    throw new Error(`Error getting thumbnails: ${data.err}`);
  }
  return data.images;
}

export async function getThumbnailsOfCanvases(
  key: string,
  document: FigNode
): Promise<{ id: string; url: string; b64: string }[]> {
  const canvasIds = getCanvasIds(document);
  const thumbnails = await getThumbnails(key, canvasIds);
  const results = [];
  for (const [id, url] of Object.entries(thumbnails)) {
    results.push({
      id,
      url,
      b64: await imageUrlToBase64(url),
    });
  }
  return results;
}

async function imageUrlToBase64(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}
