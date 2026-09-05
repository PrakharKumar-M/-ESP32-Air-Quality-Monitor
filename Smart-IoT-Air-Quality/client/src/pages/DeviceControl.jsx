import { useState } from "react";
import Layout from "../components/layout/Layout";

function DeviceControl() {

    const [led,setLed]=useState(false);
    const [fan,setFan]=useState(false);
    const [buzzer,setBuzzer]=useState(false);

    return(

<Layout>

<h2 className="mb-4">

Device Control

</h2>

<div className="card shadow">

<div className="card-body">

<table className="table">

<tbody>

<tr>

<td><strong>Device</strong></td>

<td>ESP32-001</td>

</tr>

<tr>

<td><strong>Status</strong></td>

<td>

<span className="badge bg-success">

Online

</span>

</td>

</tr>

<tr>

<td><strong>Location</strong></td>

<td>Lucknow</td>

</tr>

<tr>

<td><strong>WiFi Signal</strong></td>

<td>90%</td>

</tr>

<tr>

<td><strong>Battery</strong></td>

<td>75%</td>

</tr>

</tbody>

</table>

<hr/>

<h5>LED</h5>

<button
className={`btn ${led?"btn-success":"btn-secondary"} me-2`}
onClick={()=>setLed(true)}
>
ON
</button>

<button
className="btn btn-danger"
onClick={()=>setLed(false)}
>
OFF
</button>

<hr/>

<h5>Fan</h5>

<button
className={`btn ${fan?"btn-success":"btn-secondary"} me-2`}
onClick={()=>setFan(true)}
>
ON
</button>

<button
className="btn btn-danger"
onClick={()=>setFan(false)}
>
OFF
</button>

<hr/>

<h5>Buzzer</h5>

<button
className={`btn ${buzzer?"btn-success":"btn-secondary"} me-2`}
onClick={()=>setBuzzer(true)}
>
ON
</button>

<button
className="btn btn-danger"
onClick={()=>setBuzzer(false)}
>
OFF
</button>

<hr/>

<button className="btn btn-warning me-3">

Restart Device

</button>

<button className="btn btn-primary">

Update Firmware

</button>

</div>

</div>

</Layout>

);

}

export default DeviceControl;