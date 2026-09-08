declare module 'html-to-docx' {
  const HTMLtoDOCX: (
    htmlString: string,
    headerHTMLString?: string | null,
    documentOptions?: any,
    footerHTMLString?: string | null
  ) => Promise<Blob | Buffer>;

  export default HTMLtoDOCX;
}