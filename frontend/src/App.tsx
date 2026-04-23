import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppRouter } from "./ui/router";

const App = () => {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
};

export default App;

