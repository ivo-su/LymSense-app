import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { HashRouter, Link, Outlet, Route, Routes } from "react-router";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Nav from "./components/Nav";
import Patients from "./pages/Patients";
import Logs from "./pages/Logs";
import Patient from "./pages/Patient";
import BackButton from "./components/BackButton";

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
            <Route path="/about" element={<div className="box page-title"><BackButton /><h1>About</h1></div>} />
            <Route path="/contact" element={<div className="box page-title"><BackButton /><h1>Contact</h1></div>} />
            <Route path="/logs" element={<Logs/>} />
            <Route path="/patients" element={<Patients/>} />
            <Route path="/patients/:id" element={<Patient/>} />
          </Route>
          <Route path="/signup" element={<SignUp/>} />
          <Route path="/signin" element={<SignIn/>} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
