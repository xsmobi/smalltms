import React from "react";

const MarkdownParser = ({ text }) => {
  const parseMarkdown = (input) => {
    if (!input) return "";

    // Repair unmatched '**', '*', '__', '_'
    const repairedText = input
      .replace(/(\*\*[^*]*)(?!\*\*)/g, "$1**")
      .replace(/(\*[^*]*)(?!\*)/g, "$1*")
      .replace(/(__[^_]*)(?!__)/g, "$1__")
      .replace(/(_[^_]*)(?!_)/g, "$1_");

    // Handle bold (** and __)
    let html = repairedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Handle italic (* and _)
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/_(.*?)_/g, "<em>$1</em>");

    // Handle line breaks and paragraphs
    html = html
      .split(/\r?\n\r?\n/) // Split into paragraphs (double line breaks)
      .map((paragraph) => 
        paragraph
          .split(/\r?\n/) // Handle single line breaks within a paragraph
          .map((line) => line.trim())
          .filter((line) => line) // Remove empty lines
          .join("<br />") // Replace single line breaks with <br>
      )
      .map((paragraph) => `<p>${paragraph}</p>`) // Wrap paragraphs in <p>
      .join(""); // Join paragraphs without extra line breaks

    return html;
  };

  return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }} />;
};

export default MarkdownParser;
