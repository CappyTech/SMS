#install
npm install

#.env
DB_HOST=0
DB_USER=
DB_PASSWORD=
DB_DATABASE=
DB_PORT=
INCORPORATION_YEAR=


Make map for jobs, maybe open street maps.

Send Jobs to kashflow.
Send Quotes to kashflow.

Use leaflet.js
Make Clients have colours for pins on maps.

Geolocation:

You can use Leaflet to get the user's current location and display it on the map.

When making Quotes, have the surveyor use current location has location for quote, for future directions for crews.

Quotes - quote has quote_ref
Jobs > quote has job_ref

Subcontractor Table
Worker Table
Client Table

// Half days?
Attendance Table
> workerId column (foreign key)
> subcontractorId column (foreign key)
> clientId column (foreign key)
> locationId column (foreign key)
- date column
