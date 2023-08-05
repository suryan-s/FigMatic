// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Skip over invisible nodes and their descendants inside instances
// for faster performance.
// figma.skipInvisibleInstanceChildren = true

async function print(input: string) {
  const text = figma.createText();

  // Move to (50, 50)
  text.x = 50;
  text.y = 50;

  // Load the font in the text node before setting the characters
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  text.characters = `${input}`;

  // Set bigger font size and red color
  text.fontSize = 18;
  text.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
  figma.currentPage.appendChild(text);
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "export-html") {
    let nodeList: BaseNode[] = [];
    function traverse(node: BaseNode) {
      nodeList = [...nodeList, node];
      print(node.type);
      if ("children" in node) {
        if (node.type !== "INSTANCE") {
          for (const child of node.children) {
            traverse(child);
          }
        }
      }
    }
    traverse(figma.root); // start the traversal at the root
  }
};
