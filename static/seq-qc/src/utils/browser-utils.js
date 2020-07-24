const supportsWebGl = () => {
    try {
        // Try to throw an error
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        ctx.getSupportedExtensions();
    } catch (e) {
        return false;
    }

    return true;
};
export const preProcess = (data) => {
    const charts = data['charts'] || [];

    for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];
        if (chart.layout) {
            chart.title = chart.layout.title;
            chart.layout.title = '';
        }
    }

    const supports_webgl = supportsWebGl();
    if (supports_webgl) {
        return data;
    }

    for (let i = 0; i < charts.length; i++) {
        const chart = data.charts[i];
        if (chart.data) {
            for (let j = 0; j < chart.data.length; j++) {
                const trace = chart.data[j];
                if (trace.type === "scattergl") {
                    trace.type = "scatter";
                }
            }
        }
    }

    return data;
};