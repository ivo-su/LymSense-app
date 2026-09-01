import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { HashRouter, Link, Outlet, Route, Routes } from "react-router";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Nav from "./components/Nav";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <HashRouter>
      <main className="container">
        <Routes>
          <Route path="/" element={
            <>
            <Nav/>
            <div className="content">
              <Outlet/>
            </div>
            </>
          }>
            <Route index element={<Home/>} />
            <Route path="/about" element={<h1>About</h1>} />
            <Route path="/contact" element={<h1>Contact</h1>} />
          </Route>
          <Route path="/signup" element={<SignUp/>} />
          <Route path="/signin" element={<SignIn/>} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
