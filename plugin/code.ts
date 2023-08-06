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

async function printTree(tree: Tree<PageNode | SceneNode>) {
  const result = await tree.generateTreeObject(tree.root);
  const HTML = generateHTMLString(result);
  const CSS = generateCSSString(result);
  console.log(result, HTML, CSS);
  figma.ui.postMessage({ html: HTML, css: CSS, title: tree.root?.data.name });
}
function generateCSSString(node: any, depth = 0) {
  let cssString = "";

  // Indentation for nested CSS rules
  const indent = "".repeat(depth * 2);

  // Generate CSS rules for the current node
  if (node.key) {
    node.key = node.key.replace(/:/g, "-");
    cssString += indent + "." + node.key + " {";
    // Convert cssContent object to CSS properties
    if (node.cssContent) {
      Object.keys(node.cssContent).forEach((property) => {
        cssString +=
          indent + "  " + property + ": " + node.cssContent[property] + ";";
      });
    }
    cssString += indent + "}";
  }

  // Generate CSS rules for child nodes
  if (node.children && node.children.length > 0) {
    for (const childNode of node.children) {
      cssString += generateCSSString(childNode, depth + 1);
    }
  }

  return cssString;
}

function generateHTMLString(node: any) {
  let htmlString = "<!DOCTYPE html>";
  node.key = node.key?.replace(/:/g, "-");
  node.key = `class-${node.key}`;

  if (node.type === "PAGE") {
    htmlString += `<html><head><link rel="stylesheet" href="style.css"></head><body>`;
  } else if (node.type === "FRAME") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "COMPONENT") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "GROUP") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "SECTION") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "RECTANGLE") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "TEXT") {
    htmlString += '<p class="' + node.key + '">' + node.data.text + "</p>";
  }

  if (node.children && node.children.length > 0) {
    for (const childNode of node.children) {
      htmlString += generateHTMLString(childNode);
    }
  }

  if (node.type === "PAGE") {
    htmlString += "</body></html>";
  } else if (node.type === "FRAME") {
    htmlString += "</div>";
  } else if (node.type === "COMPONENT") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "GROUP") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "SECTION") {
    htmlString += '<div class="' + node.key + '">';
  } else if (node.type === "RECTANGLE") {
    htmlString += '<div class="' + node.key + '">';
  }

  return htmlString;
}

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
