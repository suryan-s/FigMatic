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
figma.skipInvisibleInstanceChildren = true;

// Define the TreeNode interface with a 'data' property
interface TreeNode<T> {
  key: string;
  data: any; // 'data' can be of any type you need
  children: TreeNode<T>[];
}

// Define the Tree class
class Tree<T> {
  public root: TreeNode<T> | null;

  constructor(t?: TreeNode<T>) {
    this.root = t || null;
  }

  // Add a node to the tree
  insert(key: string, data: T, parentKey?: string): void {
    const newNode: TreeNode<T> = { key, data, children: [] };

    if (!parentKey) {
      // If parentKey is not provided, make the new node the root
      this.root = newNode;
    } else {
      // Find the parent node in the tree
      const parentNode = this.findNode(this.root, parentKey);
      if (parentNode) {
        // Add the new node as a child of the parent node
        parentNode.children.push(newNode);
      } else {
        console.error(`Parent node with key "${parentKey}" not found.`);
      }
    }
  }
  async generateTreeObject(node: TreeNode<T> | null): Promise<any> {
    if (!node) {
      return null;
    }

    const { key, data } = node;
    const cssContent = await node.data.getCSSAsync();

    const newNodeInfo = {
      key,
      data: {
        name: data.name,
        id: data.id,
        text: data.characters || null,
        isAsset: data.isAsset,
      },
      cssContent,
      type: data.type,
      children: [] as any,
    };

    if (node.children.length > 0) {
      newNodeInfo.children = await Promise.all(
        node.children.map((child) => this.generateTreeObject(child))
      );
    }

    return newNodeInfo;
  }

  // Find a node in the tree given its key
  find(key: string): TreeNode<T> | null {
    return this.findNode(this.root, key);
  }

  // Internal function to find a node in the tree
  private findNode(node: TreeNode<T> | null, key: string): TreeNode<T> | null {
    if (!node) {
      return null;
    }

    if (node.key === key) {
      return node;
    }

    for (const child of node.children) {
      const foundNode = this.findNode(child, key);
      if (foundNode) {
        return foundNode;
      }
    }

    return null;
  }
}

// // Example usage:
// const tree = new Tree();
// tree.insert("A", { name: "Node A" });
// tree.insert("B", { name: "Node B" }, "A");
// tree.insert("C", { name: "Node C" }, "A");
// tree.insert("D", { name: "Node D" }, "B");

// const nodeB = tree.find("B");

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

async function printTree(tree: Tree<PageNode | SceneNode>) {
  const result = await tree.generateTreeObject(tree.root);
  console.log(result);
}
function generateCSSString(
  className: string,
  cssProperties: Record<string, string | number>
): string {
  let cssPropertiesString = "";

  for (const property in cssProperties) {
    if (Object.prototype.hasOwnProperty.call(cssProperties, property)) {
      const value = cssProperties[property];
      cssPropertiesString += `${property}: ${value}; `;
    }
  }

  return `.${className} { ${cssPropertiesString} }`;
}
function generateHTML(obj: any) {}
figma.ui.onmessage = (msg) => {
  if (msg.type === "export-html") {
    let nodeTree: Tree<PageNode | SceneNode> = new Tree();
    function traverse(node: PageNode | SceneNode) {
      if (node.type === "PAGE") {
        nodeTree.insert(node.id, node);
      } else {
        nodeTree.insert(node.id, node, node.parent?.id);
      }
      if ("children" in node) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(figma.currentPage); // start the traversal at the current page
    console.log(nodeTree);
    printTree(nodeTree);
  }
};
