import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  body {
    background-color: #1a1a2e;
    color:rgb(0, 0, 0);
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #1a1a2e;
  }

  ::-webkit-scrollbar-thumb {
    background: #00b4d8;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #0096c7;
  }
`;

export default GlobalStyle;