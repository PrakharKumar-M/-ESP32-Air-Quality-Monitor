import {
FaHome,
FaChartLine,
FaMicrochip,
FaBell,
FaCog
} from "react-icons/fa";

import {Link} from "react-router-dom";

function Sidebar(){

return(

<div

className="text-white"

style={{

width:"250px",

background:"#1F2937",

minHeight:"100vh"

}}

>

<h3 className="text-center py-4">

Dashboard

</h3>

<div className="px-3">

<Link className="nav-link text-white" to="/">

<FaHome className="me-2"/>

Home

</Link>

<Link className="nav-link text-white" to="/dashboard">

<FaChartLine className="me-2"/>

Dashboard

</Link>

<Link className="nav-link text-white" to="#">

<FaMicrochip className="me-2"/>

Devices

</Link>

<Link className="nav-link text-white" to="#">

<FaBell className="me-2"/>

Alerts

</Link>

<Link className="nav-link text-white" to="#">

<FaCog className="me-2"/>

Settings

</Link>

</div>

</div>

);

}

export default Sidebar;