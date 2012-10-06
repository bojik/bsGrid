<?php
/**
 * @author Alexander Rodionov <web@devgu.ru>
 * @version $Id$
 */
/*
CREATE TABLE persons(
    id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    company VARCHAR(255)
);

INSERT INTO persons (name, company) VALUES('Bob', 'Macrosoft'), ('Jim', 'Abode'), ('Elice', 'Falsebook');
*/
$link = mysql_connect('127.0.0.1:3306', 'root', 'foxmulder');
if (!$link) {
    die('Could not connect: ' . mysql_error());
}
mysql_select_db('personals');

$offset = empty($_POST['offset']) ? 0 : intval($_POST['offset']);
$limit = empty ($_POST['limit']) ? 10 : intval($_POST['limit']);
$sortField = empty ($_POST['sortName']) ? 'id' : trim($_POST['sortName']);
$sortOrder = empty ($_POST['sortOrder']) ? 'asc' : strtolower(trim($_POST['sortOrder']));
$filterText = empty ($_POST['text']) ? '' : trim($_POST['text']);

if (!in_array(strtolower($sortOrder), array('asc', 'desc'))) {
    $sortOrder = 'asc';
}

if (!in_array($sortField, array ('id', 'name', 'company'))){
    $sortField = 'id';
}

$filter = array (1);

if (!empty ($filterText)){
    $filter[] = "(id LIKE '%".mysql_real_escape_string($filterText)."%' OR
                  name LIKE '%".mysql_real_escape_string($filterText)."%' OR
                  company LIKE '%".mysql_real_escape_string($filterText)."%')";
}

$sql = sprintf("SELECT count(*) FROM persons WHERE %s", implode(' AND ', $filter));
$result = mysql_query($sql);
$row = mysql_fetch_array($result);
$total = $row[0];

$sql = sprintf("SELECT * FROM persons WHERE %s ORDER BY %s %s LIMIT %d, %d", implode(' AND ', $filter), $sortField, $sortOrder, $offset, $limit);
$result = mysql_query($sql);
if ($result === false) {
    die(mysql_error());
}
$rows = array();
while ($row = mysql_fetch_assoc($result)) {
    $rows[] = $row;
}
mysql_close($link);
$response = new StdClass();
$response->success = true;
$response->total = $total;
$response->rows = $rows;
echo json_encode($response);