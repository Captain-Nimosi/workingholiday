const REPO_OWNER = "Captain-Nimosi";
const REPO_NAME = "workingholiday";
const BRANCH = "main";

async function getDirectory(path = "") {
  const url =
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return await response.json();
}

async function hasIndexFile(path) {
  try {
    const contents = await getDirectory(path);

    return contents.some(
      item => item.type === "file" && item.name === "index.html"
    );
  } catch {
    return false;
  }
}

async function getPageTitle(path) {
  try {
    const url =
      `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}/index.html`;

    const response = await fetch(url);

    if (!response.ok) {
      return formatName(path.split("/").pop());
    }

    const html = await response.text();

    const match = html.match(/<title>(.*?)<\/title>/i);

    if (match) {
      return match[1]
        .replace(/—.*$/, "")
        .trim();
    }

    return formatName(path.split("/").pop());

  } catch {
    return formatName(path.split("/").pop());
  }
}

function formatName(name) {
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

async function createArchiveList() {
  const container = document.querySelector("[data-archive]");

  if (!container) {
    return;
  }

  const currentPath = container.dataset.archive || "";

  try {
    const contents = await getDirectory(currentPath);

    const directories = contents.filter(
      item => item.type === "dir"
    );

    const pages = [];

    for (const directory of directories) {
      const path = currentPath
        ? `${currentPath}/${directory.name}`
        : directory.name;

      const exists = await hasIndexFile(path);

      if (exists) {
        const title = await getPageTitle(path);

        pages.push({
          name: directory.name,
          title: title,
          path: path
        });
      }
    }

    pages.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );

    container.innerHTML = "";

    pages.forEach(page => {
      const li = document.createElement("li");
      const link = document.createElement("a");

      link.href = `${page.name}/`;
      link.textContent = page.title;

      li.appendChild(link);
      container.appendChild(li);
    });

  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", createArchiveList);
