import "./StatCard.css";

function StatCard({ title, value, unit, color }) {
    return (
        <div className="col-lg-4 col-md-6 mb-4">
            <div className="card shadow stat-card">

                <div className="card-body">

                    <h6>{title}</h6>

                    <h2 style={{ color }}>
                        {value}
                        <small> {unit}</small>
                    </h2>

                </div>

            </div>
        </div>
    );
}

export default StatCard