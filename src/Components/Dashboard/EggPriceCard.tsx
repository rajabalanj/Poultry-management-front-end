import React, { useState, useEffect } from 'react';
import { eggPriceApi } from '../../services/api';
import { EggPrice } from '../../types/EggPrice';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import * as Icons from 'lucide-react';

const EggPriceCard: React.FC = () => {
  const [data, setData] = useState<EggPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        setIsLoading(true);
        const result = await eggPriceApi.fetchCurrent();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prices');
      } finally {
        setIsLoading(false);
      }
    };
    loadPrices();
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">Error loading current egg prices.</Alert>;
  }

  if (!data) return null;

  return (
    <Card className="shadow-sm mb-4 border-0">
      <Card.Header className="bg-white border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-primary d-flex align-items-center">
            <Icons.Egg className="me-2" size={20} />
            Current Market Egg Prices
          </h5>
          <span className="badge bg-light text-dark border fw-normal">
            As of: {data.date}
          </span>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-4">
          <Col xs={6} md={4} lg={2}>
            <div className="text-muted small mb-1">Single Egg</div>
            <h4 className="fw-bold mb-0">{data["Single Egg Rate"]}</h4>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <div className="text-muted small mb-1">Dozen</div>
            <h4 className="fw-bold mb-0">{data["Dozen Eggs Rate"]}</h4>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <div className="text-muted small mb-1">100 Eggs</div>
            <h4 className="fw-bold mb-0 text-success">{data["100 Eggs Rate"]}</h4>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <div className="text-muted small mb-1">Average Market</div>
            <h4 className="fw-bold mb-0 text-secondary">{data["Average Market Price"]}</h4>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <div className="text-muted small mb-1 text-success">Best ({data["Best Price Market"]})</div>
            <h4 className="fw-bold mb-0 text-success">{data["Best Market Price"]}</h4>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <div className="text-muted small mb-1 text-danger">Lowest ({data["Lowest Price Market"]})</div>
            <h4 className="fw-bold mb-0 text-danger">{data["Lowest Market Price"]}</h4>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default EggPriceCard;