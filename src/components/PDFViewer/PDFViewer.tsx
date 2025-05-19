import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

interface PDFViewerProps {
  pdfUrl: string;
  initialPage?: number | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, initialPage }) => {
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const toolbarPluginInstance = toolbarPlugin({
    fullScreenPlugin: {
      enableShortcuts: true,
    },
  });

  const { Toolbar } = toolbarPluginInstance;
  const { CurrentPageInput, NumberOfPages } = pageNavigationPluginInstance;

  return (
    <div className="h-full w-full">
      <div className="border-b border-gray-200 p-2">
        <Toolbar>
          {(slots) => {
            const {
              ZoomOut,
              ZoomIn,
              Download,
              EnterFullScreen,
            } = slots;

            return (
              <div className="flex items-center gap-2">
                <ZoomOut />
                <ZoomIn />
                <Download />
                <EnterFullScreen />
                <div className="mx-2 flex items-center gap-1">
                  <span>Page</span>
                  <CurrentPageInput /> 
                  <span>of</span> 
                  <NumberOfPages />
                </div>
              </div>
            );
          }}
        </Toolbar>
      </div>
      <div className="h-[calc(100%-48px)]">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[toolbarPluginInstance, pageNavigationPluginInstance]}
            initialPage={initialPage ? initialPage - 1 : 0}
            defaultScale={0.8}
          />
        </Worker>
      </div>
    </div>
  );
};

export default PDFViewer; 