import "./StatCard.css";

function StatCard({ title, value, unit, icon, color }) {
  return (
    <div className="col-xl-4 col-md-6 mb-4">
      <div className="stat-card">

        <div
          className="stat-icon"
          style={{ background: color }}
        >
          {icon}
        </div>

        <div>

          <h6>{title}</h6>

          <h2>
            {value}
            <small> {unit}</small>
          </h2>

        </div>

      </div>
    </div>
  );
}

export default StatCard;