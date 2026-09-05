import {
FaLeaf,
FaBell,
FaUserCircle
} from "react-icons/fa";

function Navbar(){

const today=new Date();

return(

<nav className="navbar navbar-expand-lg navbar-dark shadow">

<div className="container-fluid">

<h4 className="text-white fw-bold">

<FaLeaf className="me-2"/>

Smart Air Quality Monitoring

</h4>

<div className="d-flex align-items-center">

<span className="text-white me-4">

🟢 Online

</span>

<span className="text-white me-4">

{today.toLocaleString()}

</span>

<FaBell size={20} className="text-white me-4"/>

<FaUserCircle size={30} className="text-white"/>

</div>

</div>

</nav>

);

}

export default Navbar;