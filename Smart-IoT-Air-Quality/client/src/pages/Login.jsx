import { useState } from "react";
import { FaLeaf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";
import { Link } from "react-router-dom";
function Login() {

    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
const navigate = useNavigate();
    async function handleLogin(e) {
  e.preventDefault();

  try {
    const res = await API.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);

    alert("Login Successful");

    navigate("/dashboard");

  } catch (err) {
    alert(err.response?.data?.message || "Login Failed");
  }
}
    return(

<div className="login-page">

<div className="login-card">

<div className="login-title">

<FaLeaf className="logo"/>

<h2>Smart Air Quality</h2>

<p>Login to Dashboard</p>

</div>

<form onSubmit={handleLogin}>

<div className="mb-3">

<label>Email</label>

<input

type="email"

className="form-control"

placeholder="Enter Email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

/>

</div>

<div className="mb-4">

<label>Password</label>

<input

type="password"

className="form-control"

placeholder="Enter Password"

value={password}

onChange={(e)=>setPassword(e.target.value)}

/>

</div>

<button className="login-btn">

Login

</button>

</form>

<div className="text-center mt-4">

<a href="#">Forgot Password?</a>

<br/>

<Link to="/register">Create Account</Link>

</div>

</div>

</div>

);

}

export default Login;