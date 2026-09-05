import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function AQIGauge({ aqi }) {

    let color="#00C853";
    let status="Good";

    if(aqi>50){
        color="#FFC107";
        status="Moderate";
    }

    if(aqi>100){
        color="#FF9800";
        status="Poor";
    }

    if(aqi>150){
        color="#F44336";
        status="Very Poor";
    }

    if(aqi>300){
        color="#7B1FA2";
        status="Hazardous";
    }

    return(

<div className="card shadow mt-4">

<div className="card-body text-center">

<h3>

Live AQI Meter

</h3>

<div
style={{
width:"220px",
margin:"30px auto"
}}
>

<CircularProgressbar

value={aqi}

maxValue={500}

text={`${aqi}`}

styles={buildStyles({

textColor:color,

pathColor:color,

trailColor:"#eeeeee"

})}

/>

</div>

<h4 style={{color}}>

{status}

</h4>

</div>

</div>

);

}

export default AQIGauge;