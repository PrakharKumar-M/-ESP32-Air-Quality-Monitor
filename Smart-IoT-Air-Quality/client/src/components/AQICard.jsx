function AQICard({ title, value, unit }) {

    return (

        <div className="col-md-4 mb-4">

            <div className="card shadow border-0">

                <div className="card-body text-center">

                    <h5>{title}</h5>

                    <h2 className="text-success">

                        {value}

                        <small>{unit}</small>

                    </h2>

                </div>

            </div>

        </div>

    );

}

export default AQICard;