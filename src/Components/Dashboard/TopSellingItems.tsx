import { useState, useEffect } from 'react';
import { reportsApi } from '../../services/api';
import { TopSellingItem } from '../../types/topSellingItem';
import { Card, Table, Form, Button, Row, Col } from 'react-bootstrap';
import Loading from '../Common/Loading';

const TopSellingItems = () => {
  const [items, setItems] = useState<TopSellingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(10);

  const fetchTopSellingItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getTopSellingItems(startDate, endDate, limit);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch with default values on initial render
    fetchTopSellingItems();
  }, []);

  const handleFetchClick = () => {
    fetchTopSellingItems();
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Top Selling Items</Card.Title>
      </Card.Header>
      <Card.Body>
        <Form>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="startDate">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group as={Col} controlId="endDate">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group as={Col} controlId="limit">
              <Form.Label>Limit</Form.Label>
              <Form.Control
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </Form.Group>
          </Row>
          <Button variant="primary" onClick={handleFetchClick} disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch'}
          </Button>
        </Form>
        <hr />
        {loading && <Loading />}
        {error && <div className="alert alert-danger">{error}</div>}
        {!loading && !error && (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Total Quantity Sold</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.item_id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.total_quantity_sold}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default TopSellingItems;
