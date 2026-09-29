const PDFDocument = require("pdfkit");


// ======================================================
// GENERATE RESULT PDF BUFFER
// ======================================================

const generateResultPDFBuffer = (
    student,
    marks,
    summary
) => {

    return new Promise((resolve, reject) => {

        try {

            const doc = new PDFDocument({
                size: "A4",
                margin: 50
            });

            const chunks = [];

            doc.on("data", (chunk) => {
                chunks.push(chunk);
            });

            doc.on("end", () => {
                const pdfBuffer =
                    Buffer.concat(chunks);

                resolve(pdfBuffer);
            });

            doc.on("error", (error) => {
                reject(error);
            });


            // ==========================================
            // HEADER
            // ==========================================

            doc
                .fontSize(20)
                .font("Helvetica-Bold")
                .text(
                    "STUDENT MANAGEMENT SYSTEM",
                    {
                        align: "center"
                    }
                );

            doc.moveDown(0.5);

            doc
                .fontSize(16)
                .text(
                    "STUDENT RESULT REPORT",
                    {
                        align: "center"
                    }
                );

            doc.moveDown(1);


            // ==========================================
            // STUDENT INFORMATION
            // ==========================================

            doc
                .fontSize(11)
                .font("Helvetica")
                .text(
                    `Student ID: ${student.studentId}`
                );

            doc.text(
                `Student Name: ${student.name}`
            );

            doc.text(
                `Department: ${student.department || "N/A"}`
            );

            doc.text(
                `Course: ${student.course || "N/A"}`
            );

            doc.text(
                `Semester: ${student.semester || "N/A"}`
            );

            doc.moveDown(1);


            // ==========================================
            // TABLE HEADER
            // ==========================================

            doc
                .font("Helvetica-Bold")
                .fontSize(10);

            const headerY = doc.y;

            doc.text(
                "Subject",
                50,
                headerY,
                { width: 80 }
            );

            doc.text(
                "Subject Name",
                130,
                headerY,
                { width: 140 }
            );

            doc.text(
                "Credits",
                270,
                headerY,
                { width: 50 }
            );

            doc.text(
                "Marks",
                320,
                headerY,
                { width: 50 }
            );

            doc.text(
                "Grade",
                370,
                headerY,
                { width: 50 }
            );

            doc.text(
                "GP",
                420,
                headerY,
                { width: 40 }
            );

            doc.text(
                "Result",
                460,
                headerY,
                { width: 60 }
            );

            doc.moveDown(0.5);

            doc
                .moveTo(50, doc.y)
                .lineTo(540, doc.y)
                .stroke();

            doc.moveDown(0.5);


            // ==========================================
            // SUBJECT DATA
            // ==========================================

            doc
                .font("Helvetica")
                .fontSize(9);

            marks.forEach((mark) => {

                const subject = mark.subject;

                const y = doc.y;

                doc.text(
                    subject.subjectCode || "-",
                    50,
                    y,
                    { width: 80 }
                );

                doc.text(
                    subject.subjectName || "-",
                    130,
                    y,
                    { width: 140 }
                );

                doc.text(
                    String(subject.credits || 0),
                    270,
                    y,
                    { width: 50 }
                );

                doc.text(
                    String(mark.totalMarks),
                    320,
                    y,
                    { width: 50 }
                );

                doc.text(
                    mark.grade,
                    370,
                    y,
                    { width: 50 }
                );

                doc.text(
                    String(mark.gradePoint),
                    420,
                    y,
                    { width: 40 }
                );

                doc.text(
                    mark.result,
                    460,
                    y,
                    { width: 60 }
                );

                doc.moveDown(1);
            });


            // ==========================================
            // SUMMARY
            // ==========================================

            doc.moveDown(1);

            doc
                .moveTo(50, doc.y)
                .lineTo(540, doc.y)
                .stroke();

            doc.moveDown(1);

            doc
                .font("Helvetica-Bold")
                .fontSize(12)
                .text("RESULT SUMMARY");

            doc.moveDown(0.5);

            doc
                .font("Helvetica")
                .fontSize(11);

            doc.text(
                `Total Marks: ${summary.totalMarks} / ${summary.totalMaximumMarks}`
            );

            doc.text(
                `Percentage: ${summary.percentage}%`
            );

            doc.text(
                `Total Credits: ${summary.totalCredits}`
            );

            doc.text(
                `SGPA: ${summary.sgpa}`
            );

            doc.text(
                `CGPA: ${summary.cgpa}`
            );

            doc.text(
                `Passed Subjects: ${summary.passedSubjects}`
            );

            doc.text(
                `Failed Subjects: ${summary.failedSubjects}`
            );

            doc.moveDown(0.5);

            doc
                .font("Helvetica-Bold")
                .text(
                    `Overall Result: ${summary.overallResult}`
                );


            // ==========================================
            // FOOTER
            // ==========================================

            doc.moveDown(3);

            doc
                .font("Helvetica")
                .fontSize(9)
                .text(
                    "Generated by Student Management System",
                    {
                        align: "center"
                    }
                );


            // Finish PDF
            doc.end();

        } catch (error) {

            reject(error);

        }

    });
};


// ======================================================
// GENERATE RESULT PDF AND SEND TO HTTP RESPONSE
// ======================================================

const generateResultPDF = async (
    student,
    marks,
    summary,
    res
) => {

    try {

        const pdfBuffer =
            await generateResultPDFBuffer(
                student,
                marks,
                summary
            );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${student.studentId}-result.pdf"`
        );

        res.send(pdfBuffer);

    } catch (error) {

        console.error(
            "PDF Generation Error:",
            error
        );

        if (!res.headersSent) {

            res.status(500).json({
                success: false,
                message: "PDF generation failed",
                error: error.message
            });

        }

    }
};


module.exports = {
    generateResultPDF,
    generateResultPDFBuffer
};