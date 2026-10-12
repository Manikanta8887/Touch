import { Button, Card } from 'antd';
import { HomeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo.png';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 selection:bg-primary selection:text-white">
      {/* Background Decorative Glowing Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <Card className="w-full max-w-lg bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-center relative z-10" variant="borderless">
        <div className="p-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl inline-block mb-4 shadow-inner border border-primary/20">
          <img src={Logo} alt="Touch Live Logo" className="h-12 w-auto mx-auto object-contain" />
        </div>

        <h1 className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-darkPurple mb-2">
          404
        </h1>
        <h2 className="text-2xl font-bold text-darkPurple mb-2">Page Not Found</h2>
        <p className="text-sm text-text mb-6 max-w-sm mx-auto">
          The requested page <code className="bg-background px-2 py-1 rounded text-primary text-xs font-mono">{document.location.pathname}</code> could not be found or has been moved.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="primary"
            icon={<HomeOutlined />}
            size="large"
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl h-11 px-6 shadow-md shadow-primary/30"
          >
            Go Home
          </Button>
          <Button
            icon={<PlayCircleOutlined className="text-primary" />}
            size="large"
            onClick={() => navigate('/livestreamingplatform')}
            className="border-2 border-border text-darkPurple hover:border-primary hover:text-primary font-bold rounded-xl h-11 px-6"
          >
            Browse Streams
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PageNotFound;
