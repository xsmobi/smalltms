const getStyles = (config) => ({
    bg: config?.background || `h-screen w-screen p-4 bg-gradient-to-r from-[#2f80ed] to-[#1cb5e0]`,
    titleColor: config?.titlecolor || `text-blue-500`,
    container: `bg-slate-100 max-w-[500px] w-full m-auto rounded-md shadow-xl p-4`,
  });
  
  export default getStyles;  