const express = require("express");

const multer = require("multer");

const fs = require("fs");

const { v4: uuidv4 } = require("uuid");

const app = express();

const PORT = 3000;

// Middleware for serving static files (uploads)

app.use(express.static("public"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Multer configuration for handling image uploads

const storage = multer.diskStorage({

    destination: "public/uploads", // folder where the images will be stored

    filename: (req, file, cb) => {

        const uniqueName = `${uuidv4()}-${file.originalname}`;

        cb(null, uniqueName); // save with a unique filename

    },

});

const upload = multer({ storage });

// File path for storing packages data

const packagesFile = "packages.json";

// Helper functions for loading and saving packages data

const loadPackages = () => {

    return fs.existsSync(packagesFile)

        ? JSON.parse(fs.readFileSync(packagesFile, "utf-8"))

        : []; // Load data from file or return empty array if file doesn't exist

};

const savePackages = (packages) => {

    fs.writeFileSync(packagesFile, JSON.stringify(packages, null, 2)); // Save data back to file

};

// Route to create a new package

app.post("/api/packages", upload.single("image"), (req, res) => {

    const {

        packageName,

        packageCondition,

        quantity,

        description,

        senderName,

        senderAddress,

        senderCountry,

        senderEmail,

        senderCountryCode,

        recipientName,

        recipientAddress,

        recipientCountry,

        recipientEmail,

        recipientCountryCode,

        sendDate,

        deliveryDate,

        packageStatus,

        packageCurrentCountry,

    } = req.body;

    // Validation for required fields

    if (!packageName || !description || !senderName || !recipientName) {

        return res.status(400).json({ message: "Required fields are missing." });

    }

    // Create new package object

    const newPackage = {

        id: uuidv4(),

        packageName,

        packageCondition,

        quantity,

        description,

        senderName,

        senderAddress,

        senderCountry,

        senderEmail,

        senderCountryCode,

        recipientName,

        recipientAddress,

        recipientCountry,

        recipientEmail,

        recipientCountryCode,

        sendDate,

        deliveryDate,

        packageStatus,

        packageCurrentCountry,

        image: req.file ? `/uploads/${req.file.filename}` : null, // Store image path if uploaded

    };

    const packages = loadPackages(); // Load existing packages data

    packages.push(newPackage); // Add new package to the list

    savePackages(packages); // Save updated packages list

    res.status(201).json({ message: "Package created successfully", id: newPackage.id });

});

// Route to fetch all packages and show them in a list for editing

app.get("/api/packages", (req, res) => {

    const packages = loadPackages(); // Load all packages

    res.json(packages); // Return list of packages

});

// Route to fetch a package's details by its tracking ID

app.get("/api/packages/:id", (req, res) => {

    const packages = loadPackages(); // Load packages data

    const package = packages.find((pkg) => pkg.id === req.params.id); // Find the package by ID

    if (!package) {

        return res.status(404).json({ message: "Package not found." }); // If package doesn't exist

    }

    res.json(package); // Return package details

});

// Route to edit an existing package

app.put("/api/packages/:id", upload.single("image"), (req, res) => {

    const packages = loadPackages(); // Load packages data

    const index = packages.findIndex((pkg) => pkg.id === req.params.id); // Find the package index

    if (index === -1) {

        return res.status(404).json({ message: "Package not found." }); // If package doesn't exist

    }

    // Update the existing package with new data (except the image)

    const updatedPackage = {

        ...packages[index], // Retain old data

        ...req.body, // Merge new data from the request body

        image: req.file ? `/uploads/${req.file.filename}` : packages[index].image, // Update image if uploaded

    };

    packages[index] = updatedPackage; // Replace old package with updated one

    savePackages(packages); // Save the updated list of packages

    res.json({ message: "Package updated successfully", package: updatedPackage });

});

// Route to display the home page with list of packages

app.get("/", (req, res) => {

    const packages = loadPackages();

    let packageListHtml = "<h1>Express Shipping Team</h1>";

    

    if (packages.length === 0) {

        packageListHtml += "<p>No packages available.</p>";

    } else {

        packageListHtml += "<ul>";

        packages.forEach(pkg => {

            packageListHtml += `

                <li>

                    <h2>${pkg.packageName}</h2>

                    <p>${pkg.description}</p>

                    <p><strong>Status:</strong> ${pkg.packageStatus}</p>

                    <button onclick="window.location.href='/edit/${pkg.id}'">Edit</button>

                </li>

            `;

        });

        packageListHtml += "</ul>";

    }

    res.send(packageListHtml);

});

// Route to display the form for editing a package

app.get("/edit/:id", (req, res) => {

    const packages = loadPackages();

    const pkg = packages.find(p => p.id === req.params.id);

    if (!pkg) {

        return res.status(404).send("Package not found.");

    }

    res.send(`

        <h1>Edit Package: ${pkg.packageName}</h1>

        <form action="/api/packages/${pkg.id}" method="POST" enctype="multipart/form-data">

            <input type="hidden" name="id" value="${pkg.id}">

            <label>Package Name: <input type="text" name="packageName" value="${pkg.packageName}" required></label><br>

            <label>Package Condition: <input type="text" name="packageCondition" value="${pkg.packageCondition}" required></label><br>

            <label>Quantity: <input type="number" name="quantity" value="${pkg.quantity}" required></label><br>

            <label>Description: <textarea name="description" required>${pkg.description}</textarea></label><br>

            <label>Sender Name: <input type="text" name="senderName" value="${pkg.senderName}" required></label><br>

            <label>Sender Address: <textarea name="senderAddress" required>${pkg.senderAddress}</textarea></label><br>

            <label>Sender Country: <input type="text" name="senderCountry" value="${pkg.senderCountry}" required></label><br>

            <label>Sender Email: <input type="email" name="senderEmail" value="${pkg.senderEmail}" required></label><br>

            <label>Recipient Name: <input type="text" name="recipientName" value="${pkg.recipientName}" required></label><br>

            <label>Recipient Address: <textarea name="recipientAddress" required>${pkg.recipientAddress}</textarea></label><br>

            <label>Recipient Country: <input type="text" name="recipientCountry" value="${pkg.recipientCountry}" required></label><br>

            <label>Recipient Email: <input type="email" name="recipientEmail" value="${pkg.recipientEmail}" required></label><br>

            <label>Send Date: <input type="date" name="sendDate" value="${pkg.sendDate}" required></label><br>

            <label>Delivery Date: <input type="date" name="deliveryDate" value="${pkg.deliveryDate}"></label><br>

            <label>Package Status: <input type="text" name="packageStatus" value="${pkg.packageStatus}" required></label><br>

            <label>Current Country: <input type="text" name="packageCurrentCountry" value="${pkg.packageCurrentCountry}" required></label><br>

            <label>Image: <input type="file" name="image"></label><br>

            <button type="submit">Update Package</button>

        </form>

    `);

});

// Start the server

app.listen(PORT, () => {

    console.log(`Server is running on http://localhost:${PORT}`);

});