class KkuLecturerController {
    static CVS_URL = "https://cvs.enit.kku.ac.th/computer"; // computer engineering information
    static REQUEST_TIMEOUT = 15000;

    static async GetLecturers(req, res) {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, KkuLecturerController.REQUEST_TIMEOUT);

        try {
            const cvsResponse = await fetch(
                KkuLecturerController.CVS_URL,
                {
                    signal: controller.signal,
                    headers: {"User-Agent": "DME-Explorer/1.0"}
                }
            );

            if (!cvsResponse.ok) {
                return res.status(502).json({
                    success: false,
                    message: response.status,
                    lecturers: []
                });
            }

            const html = await cvsResponse.text();
            const nextData = KkuLecturerController.GetNextData(html);

            if (!nextData) {
                return res.status(502).json({
                    success: false,
                    message: "Cannot get data from website",
                    lecturers: []
                });
            }

            const cvsLecturers = nextData.props?.pageProps?.products;

            /*
            if (!Array.isArray(cvsLecturers)) {
                return res.status(502).json({
                    success: false,
                    message: "Unexpected data format",
                    lecturers: []
                });
            }
            */

            const lecturers = cvsLecturers
                .map(lecturer => KkuLecturerController.FormatLecturer(lecturer))
                .filter(lecturer => lecturer.id);

            //console.log("First lecturer", cvsLecturers[0]);
            //console.log("Available fields", Object.keys(cvsLecturers[0] || {}));

            return res.status(200).json({ success: true, lecturers });
        } 
        catch (error) {
            console.error(error);

            const timeoutError = error.name === "AbortError";
            return res.status(timeoutError ? 504 : 500).json({
                success: false,
                message: timeoutError ? "The website took too long to response" : "Cannot get the information",
                lecturers: []
            });
        } 
        finally {
            clearTimeout(timeout);
        }
    }
    static GetNextData(html) {
        try {
            // searching for the html string using regular expression --> getting the next data
            // Here we will extracting the js data
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

            if (!nextDataMatch) {
                return null;
            }
            return JSON.parse(nextDataMatch[1]);

        } 
        catch (error) { 
            console.error(error);
            return null;
        }
    }

    static FormatLecturer(lecturer) {
        const lecturerId = String(lecturer.EMP_ID  || "");

        return {
            id: lecturerId,
    
            imageUrl: lecturerId ? `https://cvs.enit.kku.ac.th/img/${lecturerId}.jpg` : null,
            academicTitle: lecturer.PRENAME_ACA_NAME || "",
            thaiFirstName: lecturer.EMP_TH_FIRST_NAME || "",
            thaiLastName: lecturer.EMP_TH_LAST_NAME || "",
            englishFirstName: lecturer.EMP_ENG_FIRST_NAME?.trim() || "",
            englishLastName: lecturer.EMP_ENG_LAST_NAME?.trim() || "",
            department: lecturer.DEP_NAME || "",
            email: lecturer.EMP_EMAIL || "",
            researchInterests: lecturer.EMP_KEYWORD || ""
        };
    }
}

module.exports = KkuLecturerController;