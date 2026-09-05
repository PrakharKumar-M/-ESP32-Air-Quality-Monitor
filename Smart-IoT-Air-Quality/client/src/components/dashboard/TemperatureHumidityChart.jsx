import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function TemperatureHumidityChart({ history }) {

  const data = {

    labels: history.map((item,index)=>`#${index+1}`),

    datasets:[

      {

        label:"Temperature",

        data:history.map(item=>item.temperature),

        borderColor:"#ff5722",

        tension:.4

      },

      {

        label:"Humidity",

        data:history.map(item=>item.humidity),

        borderColor:"#2196f3",

        tension:.4

      }

    ]

  };

  return(

<div className="card shadow mt-4">

<div className="card-body">

<h4>

Temperature & Humidity Trend

</h4>

<Line data={data}/>

</div>

</div>

);

}

export default TemperatureHumidityChart;